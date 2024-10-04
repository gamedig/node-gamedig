import Core from './core.js'

/**
 * Implements the protocol for retrieving a master list for BROKE PROTOCOL, a Unity based game
 * using a custom master server
 */
export default class brokeprotocolmaster extends Core {
  constructor () {
    super()

    this.backendApiUriServers = 'https://bp.userr00t.com/serverbrowser/api/server'
    this.backendApiUriServer = 'https://bp.userr00t.com/serverbrowser/api/server/{id}'

    this.hexCharacters = [
      '&0', '&1', '&2', '&3', '&4', '&5', '&6', '&7',
      '&8', '&9', '&a', '&b', '&c', '&d', '&e', '&f'
    ]

    // Don't use the tcp ping probing
    this.usedTcp = true
  }

  async run (state) {
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
    // query server info
    const serverInfo = await this.getServerInfo(serverId)
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
    state.numplayers = snaps[0]?.playerCount || 0
    state.maxplayers = serverInfo.playerLimit || 0

    state.raw = serverInfo
    state.version = serverInfo.version || ''
  }

  /**
   * Retrieves server list from master server
   * @throws {Error} Will throw error when no master list was received
   * @returns a list of servers as raw data
   */
  async getMasterServerList () {
    const masterData = await this.request({
      url: this.backendApiUriServers,
      responseType: 'json',
      ...(this.getSearchParams())
    })

    const servers = masterData.servers
    if (servers == null) {
      throw new Error('Unable to retrieve master server list')
    }
    if (!Array.isArray(servers)) {
      throw new Error('Invalid data received from master server. Expecting list of data')
    }
    if (servers.length === 0) {
      throw new Error('No data received from master server.')
    }

    return servers
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
