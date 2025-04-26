import Core from './core.js'
// import Ajv from 'ajv'
// const ajv = new Ajv()

function objectKeysToLowerCase (input) {
  if (typeof input !== 'object') return input
  if (Array.isArray(input)) return input.map(objectKeysToLowerCase)
  return Object.keys(input).reduce(function (newObj, key) {
    const val = input[key]
    const newVal = (typeof val === 'object') && val !== null ? objectKeysToLowerCase(val) : val
    newObj[key.toLowerCase()] = newVal
    return newObj
  }, {})
}

/**
 * Implements the protocol for retrieving a master list for BROKE PROTOCOL, a Unity based game
 * using a custom master server
 */
export default class brokeprotocolmaster extends Core {
  constructor () {
    super()

    this.backendApiUriServers = 'https://bp.userr00t.com/serverbrowser/api/server'
    this.backendApiUriServer = 'https://bp.userr00t.com/serverbrowser/api/server/{id}'
    this.backendApiUriCheck = 'https://bp.userr00t.com/serverbrowser/api/'
    this.fallbackUri = 'https://brokeprotocol.com/servers.json'

    this.hexCharacters = [
      '&0', '&1', '&2', '&3', '&4', '&5', '&6', '&7',
      '&8', '&9', '&a', '&b', '&c', '&d', '&e', '&f'
    ]

    // Don't use the tcp ping probing
    this.usedTcp = true
  }

  async run (state) {
    this.hasApi = await this.checkApi()
    await this.queryInfo(state)
  }

  async queryInfo (state) {
    if (this.doQuerySingle) {
      if (this.options.serverId) {
        await this.queryServerInfo(state, this.options.serverId)
      } else {
        await this.queryServerInfoFromMaster(state)
      }
    } else {
      await this.queryMasterServerList(state)
    }
  }

  async queryMasterServerList (state) {
    const servers = await this.getMasterServerList()

    // pass processed servers as raw list
    state.raw.servers = servers.map((serverInfo) => {
      // TODO: may use any other deep-copy method like structuredClone() (in Node.js 17+)
      //       or use a method of Core to retrieve a clean state
      const serverState = JSON.parse(JSON.stringify(state))

      // set state properties based on received server info
      this.populateProperties(serverState, serverInfo)
      return serverState
    })
  }

  async queryServerInfoFromMaster (state) {
    // query master list and find specific server
    const servers = await this.getMasterServerList()
    const serverInfo = servers.find((server) => {
      return server.ip === this.options.address && `${server.port}` === `${this.options.port}`
    })

    if (serverInfo == null) {
      throw new Error('Server not found in master server list')
    }

    // set state properties based on received server info
    this.populateProperties(state, serverInfo)
  }

  async queryServerInfo (state, serverId) {
    let serverInfo = null
    if (this.hasApi) {
      // query server info from API
      serverInfo = await this.getServerInfo(serverId)
    }

    if (serverInfo == null) {
      throw new Error(`Unable to retrieve server info with given id: ${serverId}`)
    }

    // set state properties based on received server info
    this.populateProperties(state, serverInfo)
  }

  /**
   * Translates raw properties into known properties
   * @param {Object} state Parsed data
   * @param {Object} serverInfo Queried server info
   */
  populateProperties (state, serverInfo) {
    state.gameHost = serverInfo.ip || null
    state.gamePort = serverInfo.port || null

    state.name = this.sanitizeServerName(serverInfo.name || '')
    state.map = serverInfo.map?.name || ''
    state.password = false

    const snaps = [...(serverInfo.snapshots || [])]
    snaps.sort((a, b) => b?.at - a?.at)
    // API data only provides snapshot data, where as JSON data has "PlayerCount", try to use PlayerCount first
    state.numplayers = serverInfo.playercount || snaps[0]?.playercount || 0
    state.maxplayers = serverInfo.playerlimit || 0

    state.raw = serverInfo
    state.version = serverInfo.version || ''
  }

  /**
   * Checks if the API is available
   * @returns a boolean representing api availability
   */
  async checkApi () {
    try {
      await this.request({
        url: this.backendApiUriCheck,
        method: 'HEAD'
      })

      return true
    } catch (err) {
      // ignore error message
    }

    return false
  }

  /**
   * Retrieves server list from master server
   * @throws {Error} Will throw error when no master list was received
   * @returns a list of servers as raw data
   */
  async getMasterServerList () {
    const queryUrl = this.hasApi ? this.backendApiUriServers : this.fallbackUri
    const masterData = await this.request({
      url: queryUrl,
      responseType: 'json',
      ...(this.hasApi ? this.getSearchParams() : {})
    })

    // non-api data will provide server-data only
    const servers = this.hasApi ? masterData.servers : masterData
    if (servers == null) {
      throw new Error('Unable to retrieve master server list')
    }
    if (!Array.isArray(servers)) {
      throw new Error('Invalid data received from master server. Expecting list of data')
    }
    if (servers.length === 0) {
      throw new Error('No data received from master server.')
    }

    // TODO: Ajv response validation
    // const isDataValid2 = ajv.validate(SchemaDefMasterServerListArrayServers, servers)
    // if (!isDataValid2) {
    //   throw new Error(`Received master server data is unknown/invalid: ${ajv.errorsText(ajv.errors)}`)
    // }

    // API and non-API data mismatches in letter case, force lower case (Note: loosing camel-case style for API data)
    const serversLowerCase = servers.map(x => objectKeysToLowerCase(x))
    return serversLowerCase
  }

  /**
   * Retrieves server info from API
   * @param {string} serverId the server id
   * @throws {Error} Will throw error when no master list was received
   * @returns a list of servers as raw data
   */
  async getServerInfo (serverId) {
    const serverInfo = await this.request({
      url: this.backendApiUriServer.replace(/{id}/g, serverId || ''),
      responseType: 'json',
      ...(this.getSearchParams())
    })

    if (serverInfo && !(typeof serverInfo === 'object' && !Array.isArray(serverInfo))) {
      throw new Error('Invalid data received from API. Expecting object for server info')
    }

    // TODO: Ajv response validation
    // const isDataValid = ajv.validate(SchemaResponseServerInfo, serverInfo)
    // if (!isDataValid) {
    //   throw new Error(`Received server info data is unknown/invalid: ${ajv.errorsText(ajv.errors)}`)
    // }

    return serverInfo
  }

  sanitizeServerName (name) {
    const removeStringsRecursively = (inputString, stringsToRemove) =>
      stringsToRemove.reduce((str, rem) => str.replace(new RegExp(rem, 'g'), ''), inputString).trim()

    const sanitizedName = removeStringsRecursively(name, this.hexCharacters)
    return sanitizedName
  }

  getSearchParams () {
    let intervalOption = null
    const intervalOptions = ['1h', '6h', '12h', '1d', '3d', '1w', '2w', '4w']
    if (this.options.snapshotInterval) {
      const opt = `${this.options.snapshotInterval}`.toLowerCase()
      if (intervalOptions.includes(opt)) {
        intervalOption = opt
      }
    }

    return {
      searchParams: {
        snapshotInterval: intervalOption || '1h'
      }
    }
  }
}

export const SchemaDefMasterServerListServer = {
  type: 'object',
  required: [
    'name',
    'version',
    'ip',
    'port',
    'whitelist',
    'location',
    'validation',
    'url',
    'playerLimit',
    'difficulty',
    'map',
    'assetBundles',
    'plugins',
    'flags',
    'hourlyAverageSnapshots',
    'snapshots',
    'daySnapshots',
    'id',
    'updated',
    'created'
  ],
  properties: {
    name: {
      type: 'string'
    },
    version: {
      type: 'string',
      enum: [
        '1.42',
        '1.40',
        '1.41'
      ]
    },
    ip: {
      type: 'string',
      format: 'ipv4'
    },
    port: {
      type: 'integer',
      minimum: 0,
      maximum: 65535
    },
    whitelist: {
      type: 'boolean'
    },
    location: {
      type: 'string'
      // enum: ['FR', 'GB', 'DE', 'SG', 'PL', 'NL', 'AU', 'US', 'RU']
    },
    validation: {
      type: 'string'
      // enum: ['+', '!']
    },
    url: {
      type: 'string'
    },
    playerLimit: {
      type: 'integer',
      minimum: 0
    },
    difficulty: {
      type: [
        'number',
        'integer'
      ]
    },
    map: {
      type: 'object',
      properties: {
        hash: { type: 'string' },
        name: { type: 'string' },
        filesize: { type: 'integer' }
      },
      required: ['hash', 'name', 'filesize']
    },
    assetBundles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hash: { type: 'string' },
          name: { type: 'string' },
          filesize: { type: 'integer' }
        },
        required: ['hash', 'name', 'filesize']
      }
    },
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hash: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['hash', 'name', 'description']
      }
    },
    flags: {
      type: 'integer'
    },
    hourlyAverageSnapshots: {
      type: 'array',
      items: {
        items: {}
      }
    },
    snapshots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          playerCount: { type: 'integer' },
          at: { type: 'integer' }
        },
        required: ['playerCount', 'at']
      }
    },
    daySnapshots: {
      type: 'array',
      items: {
        items: {}
      }
    },
    id: {
      type: 'string'
    },
    updated: {
      type: 'string'
    },
    created: {
      type: 'string'
    }
  }
}

export const SchemaDefMasterServerListGlobalSnapshot = {
  type: 'object',
  properties: {
    playerCount: { type: 'integer', minimum: 0 },
    at: { type: 'integer' }
  },
  required: ['playerCount', 'at']
}

export const SchemaDefMasterServerListGlobalDaySnapshot = {
  type: 'object',
  properties: {
    playerCount: { type: 'integer', minimum: 0 },
    at: { type: 'integer' }
  },
  required: ['playerCount', 'at']
}

export const SchemaDefMasterServerListArrayServers = {
  type: 'array',
  items: SchemaDefMasterServerListServer
}

export const SchemaResponseServerInfo = SchemaDefMasterServerListServer

export const SchemaResponseMasterServerList = {
  type: 'object',
  required: [
    'servers',
    'globalSnapshots',
    'globalDaySnapshots'
  ],
  properties: {
    servers: { $ref: '#/$defs/servers' },
    globalSnapshots: {
      type: 'array',
      items: { $ref: '#/$defs/globalSnapshot' }
    },
    globalDaySnapshots: {
      type: 'array',
      items: { $ref: '#/$defs/globalDaySnapshot' }
    }
  },
  $defs: {
    servers: SchemaDefMasterServerListArrayServers,
    globalSnapshot: SchemaDefMasterServerListGlobalSnapshot,
    globalDaySnapshot: SchemaDefMasterServerListGlobalDaySnapshot
  }
}
