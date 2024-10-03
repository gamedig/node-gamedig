import Core from './core.js'
import { MeteorBackendApi } from './hawakeningmaster.js'

/**
 * Implements the protocol for Hawkening, a fan project of the UnrealEngine3 based game HAWKEN
 * using a Meteor backend for the master server
 */
export default class hawakening extends Core {
  constructor () {
    super()

    // this.meteorUri = 'https://v2-services-live-pc.playhawken.com'
    const meteorUri = 'https://hawakening.com/api'
    this.backendApi = new MeteorBackendApi(this, meteorUri)
    this.backendApi.setLogger(this.logger)

    this.doLogout = true
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

    this.backendApi.cleanup()
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
      this.backendApi.accessToken = this.options.token
      await this.checkAccess()
      return
    }

    this.logger.debug(`Retrieving user access token for ${this.options.username}...`)
    const response = await this.backendApi.getClientAccessToken(this.options.username, this.options.password)

    MeteorBackendApi.AssertResponse(response, 'access token')
    MeteorBackendApi.AssertResponseMessage(response, { match: ['Access Grant Not Issued: User not found'], errorMessage: 'Invalid user name' })
    MeteorBackendApi.AssertResponseMessage(response, { match: ['Access Grant Not Issued: Incorrect password'], errorMessage: 'Incorrect password' })
    MeteorBackendApi.AssertResponseStatus(response, 'access token', { printStatus: true })
    MeteorBackendApi.AssertResponseMessage(response, 'access token', { expected: ['User Logged In'] })
    MeteorBackendApi.AssertResponseData(response, 'access token')
    this.backendApi.accessToken = response.Result
  }

  async retrieveUser () {
    this.userInfo = await this.getUserInfo()
  }

  async checkAccess () {
    this.logger.debug('Checking access ...')
    const response = await this.backendApi.getStatusServices()
    MeteorBackendApi.AssertResponseStatus(response, 'service status')
    MeteorBackendApi.AssertResponseMessage(response, 'service status', { expected: ['Status found'] })
  }

  async getUserInfo () {
    this.logger.debug(`Requesting user info for ${this.options.username} ...`)

    const response = await this.backendApi.getUserInfo(this.options.username)
    const tag = 'user info'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['Userfound'] })
    MeteorBackendApi.AssertResponseData(response, tag)
    return response.Result
  }

  async getMasterServerList () {
    this.logger.debug('Requesting game servers ...')
    const response = await this.backendApi.getMasterServerList()

    const tag = 'server list'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['Listings found'] })
    MeteorBackendApi.AssertResponseData(response, tag)

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
    const response = await this.backendApi.getServerToken(serverListing, this.userInfo)

    const tag = 'server token'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['Succesfully created the advertisement'] })
    MeteorBackendApi.AssertResponseData(response, tag)
    return response.Result
  }

  async getMatchInfo (serverToken) {
    this.logger.debug(`Requesting match info ${serverToken} ...`)
    const response = await this.backendApi.getMatchInfo(serverToken)

    const tag = 'match info'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['Successfully loaded ClientMatchmakingAdvertisement.'] })
    MeteorBackendApi.AssertResponseData(response, tag)
    return response.Result
  }

  async sendExitMessage () {
    this.logger.debug('Sending exit notify message ...')
    const response = await this.backendApi.notifyExit(this.userInfo)

    const tag = 'exit message'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['Event emission successful'] })
  }

  async sendLogout () {
    if (!this.doLogout) {
      return
    }

    this.logger.debug(`Sending logout message for ${this.userInfo?.EmailAddress || this.userInfo.Guid}...`)
    const response = await this.backendApi.logout(this.userInfo)

    const tag = 'logout message'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['AccessGrant Revoked'] })
  }
}
