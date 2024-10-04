import Core from './core.js'
// import Ajv from 'ajv'
// const ajv = new Ajv()

export const MasterServerServerInfoSchema = {
  type: 'object',
  required: [
    'IP',
    'Port',
    'Name',
    'Current Map',
    'Bots',
    'Players',
    'Game Version',
    'Variables'
  ],
  properties: {
    IP: {
      type: 'string',
      format: 'ipv4',
      description: 'IP of the server'
    },
    Port: {
      type: 'integer',
      minimum: 0,
      maximum: 65535,
      description: 'The port of the server instance to connect to for joining'
    },
    Name: {
      type: 'string',
      description: 'Name of the server, i.e.: Bob\'s Server.'
    },
    NamePrefix: {
      type: 'string',
      description: 'A prefix of the server'
    },
    'Current Map': {
      type: 'string',
      description: 'The current map\'s name the server is running is running'
    },
    Players: {
      type: 'integer',
      description: 'The number of players connected to the server',
      minimum: 0
    },
    Bots: {
      type: 'integer',
      minimum: 0,
      description: 'The number of bots'
    },
    'Game Version': {
      type: 'string',
      pattern: '^Open Beta (.*?)?$',
      description: 'Version of the build of the server'
    },
    Variables: {
      type: 'object',
      properties: {
        'Player Limit': {
          type: 'integer',
          minimum: 0,
          description: 'Maximum number of players allowed by this server'
        },
        'Time Limit': {
          type: 'integer',
          minimum: 0,
          description: 'time limit in minutes'
        },
        'Team Mode': {
          type: 'integer',
          description: 'Determines how teams are organized between matches.',
          enum: [
            0, // static,
            1, // swap
            2, // random swap
            3, // shuffle
            4, // traditional (assign as players connect)
            5, // traditional + free swap
            6 // ladder rank
          ]
        },
        'Game Type': {
          type: 'integer',
          description: 'Type of the game the server is running',
          enum: [
            0, // Rx_Game_MainMenu
            1, // Rx_Game
            2, // TS_Game
            3 // SP_Game
            // < 3 x < 1000 = RenX Unused/Reserved
            // < 1000 < x < 2^31 - 1 = Unassigned / Mod space
          ]
        },
        'Vehicle Limit': {
          type: 'integer',
          minimum: 0,
          description: 'Maximum number of vehicles allowed by this server'
        },
        'Mine Limit': {
          type: 'integer',
          minimum: 0,
          description: 'Maximum number of mines allowed by this server'
        },
        bPassworded: {
          type: 'boolean',
          description: 'Whether a password is required to enter the game'
        },
        bSteamRequired: {
          type: 'boolean',
          description: 'Whether clients required to be logged into Steam to play on this server'
        },
        bRanked: {
          type: 'boolean',
          description: 'Whether the serer is ranked/official'
        },
        bAllowPrivateMessaging: {
          type: 'boolean',
          description: 'Whether the server allows non-admin clients to PM each other'
        },
        bPrivateMessageTeamOnly: {
          type: 'boolean',
          description: 'whether private messaging is restricted to just teammates'
        },
        bAutoBalanceTeams: { // alias of 'bSpawnCrates'
          type: 'boolean',
          description: 'Whether the server will spawn crates in this game for balancing'
        },
        bSpawnCrates: {
          type: 'boolean',
          description: 'Whether the server will spawn crates in this game for balancing'
        },
        CrateRespawnAfterPickup: {
          type: 'integer',
          minimum: 0,
          description: 'interval for crate respawn (after pickup)'
        }
      },
      required: [
        'Player Limit',
        'Time Limit',
        'Team Mode',
        'Game Type',
        'Vehicle Limit',
        'Mine Limit'
      ]
    }
  }
}
export const MasterServerResponseSchema = {
  type: 'array',
  items: { $ref: '#/$defs/server' },
  $defs: {
    server: MasterServerServerInfoSchema
  }
}

/**
 * Implements the protocol for Renegade X, an UnrealEngine3 based game, using a custom master server
 */
export default class renegadex extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    // query master list and find specific server
    const servers = await this.getMasterServerList()
    const serverInfo = servers.find((server) => {
      return server.IP === this.options.address && server.Port === this.options.port
    })

    if (serverInfo == null) {
      throw new Error('Server not found in master server list')
    }

    // set state properties based on received server info
    this.populateProperties(state, serverInfo)
  }

  /**
   * Retrieves server list from master server
   * @throws {Error} Will throw error when no master list was received
   * @returns a list of servers as raw data
   */
  async getMasterServerList () {
    const servers = await this.request({
      url: 'https://serverlist-rx.totemarts.services/servers.jsp',
      responseType: 'json'
    })

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
    // const isDataValid = ajv.validate(MasterServerResponseSchema, servers)
    // if (!isDataValid) {
    //   throw new Error(`Received master server data is unknown/invalid: ${ajv.errorsText(ajv.errors)}`)
    // }

    return servers
  }

  /**
   * Translates raw properties into known properties
   * @param {Object} state Parsed data
   */
  populateProperties (state, serverInfo) {
    let emptyPrefix = ''
    if (serverInfo.NamePrefix) emptyPrefix = serverInfo.NamePrefix + ' '
    const servername = `${emptyPrefix}${serverInfo.Name || ''}`
    const numplayers = serverInfo.Players || 0
    const variables = serverInfo.Variables || {}

    state.name = servername
    state.map = serverInfo['Current Map'] || ''
    state.password = !!variables.bPassworded

    state.numplayers = numplayers
    state.maxplayers = variables['Player Limit'] || 0

    state.raw = serverInfo
    state.version = serverInfo['Game Version'] || ''
  }
}
