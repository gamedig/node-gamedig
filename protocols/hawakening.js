import Core from './core.js'
// import { TranslateMapUT3 } from './ut3.js'

/**
 * Deeply merges two objects, combining their properties recursively.
 *
 * If both objects have a property with the same key and that property is an object,
 * the properties of the second object will be merged into the first object's property.
 * If the property is not an object or if it does not exist in the first object,
 * the property from the second object will overwrite the property in the first object.
 *
 * @param {Object} obj1 - The first object to merge.
 * @param {Object} obj2 - The second object to merge.
 * @returns {Object} A new object containing the merged properties of both input objects.
 */
function deepMerge (obj1, obj2) {
  const result = { ...obj1 }

  for (const key in obj2) {
    if (Object.hasOwn(obj2, key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        result[key] = deepMerge(obj1[key], obj2[key])
      } else {
        result[key] = obj2[key]
      }
    }
  }

  return result
}

/**
 * Implements the protocol for Hawkening, a fan project of the UnrealEngine3 based game HAWKEN
 * using a Meteor backend for the master server
 */
export default class hawakening extends Core {
  constructor () {
    super()

    // this.meteorUri = 'https://v2-services-live-pc.playhawken.com'
    this.meteorUri = 'https://hawakening.com/api'

    this.doLogout = true
    this.accessToken = null
    this.userInfo = null

    // Don't use the tcp ping probing
    this.usedTcp = true
  }

  async run (state) {
    await this.retrieveClientAccessToken()
    await this.retrieveUser()

    await this.queryInfo(state)
    await this.cleanup(state)
  }

  async queryInfo (state) {
    const servers = await this.getMasterServerList()
    const serverListing = servers.find((server) => {
      return server.Guid === this.options.serverId
    })

    this.logger.debug('Server Listing:', serverListing)
    if (serverListing == null) {
      throw new Error('Server not found in master server listing')
    }

    const serverInfo = await this.getServerInfo(serverListing)
    this.logger.debug('Server Info:', serverInfo)
    if (!serverInfo) {
      throw new Error('Invalid server info received')
    }

    // set state properties based on received server info
    Object.assign(state.raw, { serverListing, serverInfo })
    this.populateProperties(state)
  }

  async cleanup (state) {
    await this.sendExitMessage()
    await this.sendLogout()

    this.accessToken = null
    this.userInfo = null
  }

  /**
   * Translates raw properties into known properties
   * @param {Object} state Parsed data
   */
  populateProperties (state) {
    const { serverListing: listing, serverInfo: info } = state.raw

    if (info) {
      state.gameHost = info.AssignedServerIp
      state.gamePort = info.AssignedServerPort
    }

    state.name = listing.ServerName || ''
    state.map = listing.Map || ''
    state.numplayers = listing.Users?.length || 0
    state.maxplayers = listing.MaxUsers || 0
    state.version = listing.GameVersion || ''
  }

  async retrieveClientAccessToken () {
    if (this.options.token) {
      this.doLogout = false
      this.accessToken = this.options.token
      await this.checkAccess()
      return
    }

    this.logger.debug('Requesting client access token ...')
    this.accessToken = await this.getClientAccessToken()
  }

  async retrieveUser () {
    this.userInfo = await this.getUserInfo()
  }

  async makeCall (endpoint, requestParams, callParams) {
    const { requireAuth = false } = callParams

    const url = `${this.meteorUri}/${endpoint}`
    const headers = {
      Accept: '*/*',
      'Content-Type': 'application/json',
      ...(requireAuth ? { Authorization: `Basic ${this.accessToken}` } : {})
    }

    const defaultParams = {
      url,
      headers,
      method: 'GET',
      responseType: 'json'
    }
    const requestCollection = deepMerge(defaultParams, requestParams)

    this.logger.debug(`${requestCollection.method || 'GET'}: ${url}`)
    const response = await this.request(requestCollection)
    return response
  }

  async checkAccess () {
    this.logger.debug('Checking access ...')
    const response = await this.makeCall('status/services', {}, { requireAuth: true })

    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving status message with no valid response')
    }
    if (response.Message?.toLowerCase() !== 'Status found'.toLowerCase()) {
      throw new Error('Invalid status message received')
    }
  }

  async getClientAccessToken () {
    this.logger.debug(`Retrieving user access token for ${this.options.username}...`)

    const endpoint = `users/${encodeURIComponent(this.options.username)}/accessGrant`
    const body = { Password: this.options.password }
    const response = await this.makeCall(endpoint, { json: body, method: 'POST', headers: { myheader: 'test' } }, { requireAuth: true })

    if (!response) {
      throw new Error('Error retrieving access token with no valid response')
    }
    if (response.Message?.toLowerCase() === 'Access Grant Not Issued: User not found'.toLowerCase()) {
      throw new Error('Invalid user name')
    }
    if (response.Message?.toLowerCase() === 'Access Grant Not Issued: Incorrect password'.toLowerCase()) {
      throw new Error('Incorrect password')
    }
    if (response.Status !== 200) {
      throw new Error(`Error retrieving valid access token response. Response Status: ${response.Status}`)
    }
    if (response.Message?.toLowerCase() !== 'User Logged In'.toLowerCase()) {
      throw new Error('Invalid access token message received')
    }
    if (!response.Result) {
      throw new Error('No access token received')
    }

    return response.Result
  }

  async getUserInfo () {
    this.logger.debug(`Requesting user info for ${this.options.username} ...`)

    const endpoint = `users/${encodeURIComponent(this.options.username)}`
    const response = await this.makeCall(endpoint, {}, { requireAuth: true })
    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving user info with no valid response')
    }
    if (response.Message?.toLowerCase() !== 'Userfound'.toLowerCase()) {
      throw new Error('Invalid user info message received')
    }
    if (response.Result == null) {
      throw new Error('No user info received')
    }

    return response.Result
  }

  async getMasterServerList () {
    this.logger.debug('Requesting game servers ...')
    const response = await this.makeCall('gameServerListings', {}, { requireAuth: true })
    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving access token with no valid response')
    }
    if (response.Message?.toLowerCase() !== 'Listings found'.toLowerCase()) {
      throw new Error('Invalid server list message received')
    }
    if (response.Result == null) {
      throw new Error('No server listing received')
    }

    const servers = response.Result
    if (!Array.isArray(servers)) {
      throw new Error('Invalid data received from master server. Expecting list of data')
    }
    if (servers.length === 0) {
      throw new Error('No data received from master server.')
    }

    return servers
  }

  async getServerInfo (serverListing) {
    const serverToken = await this.getServerToken(serverListing)
    const matchInfo = await this.getMatchInfo(serverToken)
    return matchInfo
  }

  async getServerToken (serverListing) {
    this.logger.debug(`Requesting server token ${serverListing.Guid} ...`)

    const body = {
      GameVersion: serverListing.GameVersion,
      OwnerGuid: this.userInfo.Guid,
      Region: serverListing.Region,
      RequestedServerGuid: serverListing.Guid,
      Users: [this.userInfo.Guid]
    }
    const response = await this.makeCall('hawkenClientMatchmakingAdvertisements', { json: body, method: 'POST' }, { requireAuth: true })
    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving server token with no valid response')
    }
    if (response.Message?.toLowerCase() !== 'Succesfully created the advertisement'.toLowerCase()) {
      throw new Error('Invalid server token message received')
    }
    if (response.Result == null) {
      throw new Error('No server token received')
    }

    return response.Result
  }

  async getMatchInfo (serverToken) {
    this.logger.debug(`Requesting match info ${serverToken} ...`)

    const endpoint = `hawkenClientMatchmakingAdvertisements/${serverToken}`
    const response = await this.makeCall(endpoint, {}, { requireAuth: true })
    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving match info with no valid response')
    }
    if (response.Message?.toLowerCase() !== 'Successfully loaded ClientMatchmakingAdvertisement.'.toLowerCase()) {
      throw new Error('Invalid match info message received')
    }
    if (response.Result == null) {
      throw new Error('No match info received')
    }

    return response.Result
  }

  async sendExitMessage () {
    this.logger.debug('Sending exit notify message ...')

    const body = [{
      Data: {
        TimeCreated: (new Date().getTime() / 1000)
      },
      Producer: {
        Id: '\\Hawken-CL142579\\Binaries\\Win32\\HawkenGame-Win32-Shipping.exe',
        Type: 'HawkenGameClient'
      },
      Subject: {
        Id: this.userInfo.Guid,
        Type: 'Player'
      },
      Timestamp: (new Date().toISOString()),
      Verb: 'ExitClient'
    }]
    const response = await this.makeCall('gameClientEvent', { json: body, method: 'POST' }, { requireAuth: true })
    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving exit message response')
    }
    if (response.Message?.toLowerCase() !== 'Event emission successful'.toLowerCase()) {
      throw new Error('Invalid exit message received')
    }
  }

  async sendLogout () {
    if (!this.doLogout) {
      return
    }

    this.logger.debug(`Sending logout message for ${this.userInfo?.EmailAddress || this.userInfo.Guid}...`)

    const endpoint = `users/${this.userInfo.Guid}/accessGrant`
    const body = { AccessGrant: this.accessToken }
    const response = await this.makeCall(endpoint, { json: body, method: 'PUT' }, { requireAuth: true })
    if (!response || response.Status !== 200) {
      throw new Error('Error retrieving logout response')
    }
    if (response.Message?.toLowerCase() !== 'AccessGrant Revoked'.toLowerCase()) {
      throw new Error('Invalid logout message received')
    }
  }
}
