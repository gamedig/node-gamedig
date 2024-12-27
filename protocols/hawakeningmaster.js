import Core from './core.js'
// import Ajv from 'ajv'
// const ajv = new Ajv()

/**
 * Implements the protocol for retrieving a master list for Hawakening, a fan project of the UnrealEngine3 based game HAWKEN
 * using a Meteor backend for the master server
 */
export default class hawakeningmaster extends Core {
  constructor () {
    super()

    // backend API url for original Hawken release
    // const meteorUri = 'https://v2-services-live-pc.playhawken.com'
    // Hawakening API for public release in 2024
    const meteorUri = 'https://hawakening.com/api'

    this.backendApi = new MeteorBackendApi(this, meteorUri)
    this.backendApi.setLogger(this.logger)

    // set when querying needs access token
    this.requireToken = false
    // set when querying for specific server only
    this.doQuerySingle = false
    // set to logout on cleanup (to revoke access token)
    this.doLogout = true

    // stored user, queried from backend
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
    if (this.doQuerySingle) {
      await this.queryInfoSingle(state)
    } else {
      await this.queryInfoMultiple(state)
    }
  }

  async queryInfoMultiple (state) {
    const servers = await this.getMasterServerList()

    // pass processed servers as raw list
    state.raw.servers = servers.map((serverListing) => {
      // TODO: may use any other deep-copy method like structuredClone() (in Node.js 17+)
      //       or use a method of Core to retrieve a clean state
      const serverState = JSON.parse(JSON.stringify(state))

      // set state properties based on received server info
      this.populateProperties(serverState, { serverListing })
      return serverState
    })
  }

  async queryInfoSingle (state) {
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
    this.populateProperties(state, { serverListing, serverInfo })
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
   * @param {Object} data Queried data
   */
  populateProperties (state, data) {
    const { serverListing: listing, serverInfo: info } = data

    if (info) {
      state.gameHost = info.AssignedServerIp || null
      state.gamePort = info.AssignedServerPort || null
    }

    state.name = listing.ServerName || ''
    state.map = listing.Map || ''
    state.password = !!listing.DeveloperData?.PasswordHash

    state.numplayers = listing.Users?.length || 0
    state.maxplayers = listing.MaxUsers || 0
    state.version = listing.GameVersion || ''

    // provide raw server info
    Object.assign(state.raw, { listing, info })
  }

  async retrieveClientAccessToken () {
    if (this.options.token) {
      this.doLogout = false
      this.backendApi.accessToken = this.options.token
      await this.checkAccess()
      return
    }

    if (!this.options.username && !this.requireToken) {
      this.logger.debug('retrieveClientAccessToken: No username provided but no token required for current protocol.')
      return
    }

    this.logger.debug(`Retrieving user access token for ${this.options.username}...`)
    const response = await this.backendApi.getClientAccessToken(this.options.username, this.options.password)

    const tag = 'access token'
    MeteorBackendApi.AssertResponse(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { match: ['Access Grant Not Issued: Unrecognized options for login request'], errorMessage: 'No user name or password' })
    MeteorBackendApi.AssertResponseMessage(response, tag, { match: ['Access Grant Not Issued: User not found'], errorMessage: 'Invalid user name' })
    MeteorBackendApi.AssertResponseMessage(response, tag, { match: ['Access Grant Not Issued: Incorrect password'], errorMessage: 'Incorrect password' })
    MeteorBackendApi.AssertResponseStatus(response, tag, { printStatus: true })
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['User Logged In'] })
    MeteorBackendApi.AssertResponseData(response, tag)

    this.backendApi.accessToken = response.Result
    await this.checkAccess()
  }

  async retrieveUser () {
    if (!this.options.username && !this.requireToken) {
      this.logger.debug('retrieveUser: No username provided but no token required for current protocol.')
      return
    }

    this.userInfo = await this.getUserInfo()
  }

  async checkAccess () {
    this.logger.debug('Checking access ...')
    const responseServices = await this.backendApi.getStatusServices()
    MeteorBackendApi.AssertResponseStatus(responseServices, 'service status')
    MeteorBackendApi.AssertResponseMessage(responseServices, 'service status', { expected: ['Status found'] })

    const responseTest = await this.backendApi.getBundles()
    MeteorBackendApi.AssertResponseStatus(responseTest, 'bundles')
    MeteorBackendApi.AssertResponseMessage(responseTest, 'bundles', { expected: ['Bundles Filter successful'] })
  }

  async getUserInfo () {
    this.logger.debug(`Requesting user info for ${this.options.username} ...`)
    const response = await this.backendApi.getUserInfo(this.options.username)

    const tag = 'user info'
    MeteorBackendApi.AssertResponse(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { match: ['User not found'], errorMessage: 'Invalid or no user name' })
    MeteorBackendApi.AssertResponseStatus(response, tag, { printStatus: true })
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

    // TODO: Ajv response validation
    // const isDataValid = ajv.validate(MasterServerResponseSchema, servers)
    // if (!isDataValid) {
    //   throw new Error(`Received master server data is unknown/invalid: ${ajv.errorsText(ajv.errors)}`)
    // }

    return servers
  }

  async getServerInfo (serverListing) {
    // match info is received by requesting a matchmaking "token"
    // if the server is at capacity, the response won't provide valid data (500 error)
    // return an empty server info when server is already full
    if (serverListing.MaxUsers == serverListing.Users?.length) {
      return {}
    }

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
    // in case of non-authorized query, early out and skip sending logout message
    if (!this.backendApi.accessToken || !this.userInfo) {
      return
    }

    this.logger.debug('Sending exit notify message ...')
    const response = await this.backendApi.notifyExit(this.userInfo)

    const tag = 'exit message'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['Event emission successful'] })
  }

  async sendLogout () {
    // in case of no logged user or non-authorized query, early out and skip sending logout message
    if (!this.doLogout || !this.backendApi.accessToken || !this.userInfo) {
      return
    }

    this.logger.debug(`Sending logout message for ${this.userInfo?.EmailAddress || this.userInfo.Guid}...`)
    const response = await this.backendApi.logout(this.userInfo)

    const tag = 'logout message'
    MeteorBackendApi.AssertResponseStatus(response, tag)
    MeteorBackendApi.AssertResponseMessage(response, tag, { expected: ['AccessGrant Revoked'] })
  }
}

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

function isObject (item) {
  return (typeof item === 'object' && !Array.isArray(item) && item !== null)
}

/**
 * Class representing a client for the Meteor Backend API.
 * 
 * This class provides methods for interacting with the Meteor Backend API, including
 * authentication, retrieving user information, and handling server-related operations.
 */
export class MeteorBackendApi {
  #accessToken = null
  #protocol = null
  #apiUri = null

  /**
   * Creates an instance of the MeteorBackendApi.
   * 
   * @param {Object} protocol - The protocol object to handle requests.
   * @param {string} apiUri - The base URI for the API.
   */
  constructor (protocol, apiUri) {
    this.#protocol = protocol
    this.#apiUri = apiUri
    this.logger = null
  }

  /**
   * The base URI of the API.
   * 
   * @returns {string} The API URI.
   */
  get apiUri () {
    return this.#apiUri
  }

  /**
   * Sets the current access token
   * @param {string} value the access token
   */
  set accessToken (value) {
    this.#accessToken = value
  }

  /**
   * Returns the current access token
   */
  get accessToken () {
    return this.#accessToken
  }

  /**
   * Sets the logger for the instance.
   * 
   * @param {Object} logger - The logger instance to use for logging.
   */
  setLogger (logger) {
    this.logger = logger
  }

  /**
   * Makes an API call to the specified endpoint with the given request parameters.
   * 
   * @param {string} endpoint - The API endpoint to call.
   * @param {Object} requestParams - The parameters for the API request.
   * @param {Object} callParams - Additional parameters for the call.
   * @param {boolean} [callParams.requireAuth=false] - Whether the call requires authentication.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  makeCall (endpoint, requestParams = null, callParams = null) {
    const { requireAuth = false } = callParams ?? {}

    const url = `${this.#apiUri}/${endpoint}`
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

    this.logger?.debug(`${requestCollection.method || 'GET'}: ${url}`)
    const response = this.#protocol.request(requestCollection)
    return response
  }

  /**
   * Cleans up the instance
   */
  cleanup () {
    this.accessToken = null
  }

  /**
   * Retrieves the status of the service.
   * 
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getStatusServices () {
    const response = this.makeCall('status/services')
    return response
  }

  /**
   * Retrieves Bundles.
   * 
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getBundles () {
    const response = this.makeCall('bundles', {}, { requireAuth: true })
    return response
  }

  /**
   * Retrieves an access token for a client using the provided username and password.
   * 
   * @param {string} userName - The username of the client.
   * @param {string} password - The password of the client.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getClientAccessToken (userName, password) {
    const endpoint = `users/${encodeURIComponent(userName)}/accessGrant`
    const body = { Password: password }
    const response = this.makeCall(endpoint, { json: body, method: 'POST' })
    return response
  }

  /**
   * Retrieves user information based on the username.
   * 
   * @param {string} userName - The username of the user.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getUserInfo (userName) {
    const endpoint = `users/${encodeURIComponent(userName)}`
    const response = this.makeCall(endpoint, {}, { requireAuth: true })
    return response
  }

  /**
   * Retrieves a list of master servers.
   * 
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getMasterServerList () {
    const response = this.makeCall('gameServerListings', {}, { requireAuth: true })
    return response
  }

  /**
   * Retrieves a server token based on the server listing and user information.
   * 
   * @param {Object} serverListing - The server listing object containing server details.
   * @param {Object} userInfo - The user information object.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getServerToken (serverListing, userInfo) {
    const body = {
      GameVersion: serverListing.GameVersion,
      OwnerGuid: userInfo.Guid,
      Region: serverListing.Region,
      RequestedServerGuid: serverListing.Guid,
      Users: [userInfo.Guid]
    }
    const response = this.makeCall('hawkenClientMatchmakingAdvertisements', { json: body, method: 'POST' }, { requireAuth: true })
    return response
  }

  /**
   * Retrieves match information based on the server token.
   * 
   * @param {string} serverToken - The token of the server.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  getMatchInfo (serverToken) {
    const endpoint = `hawkenClientMatchmakingAdvertisements/${serverToken}`
    const response = this.makeCall(endpoint, {}, { requireAuth: true })
    return response
  }

  /**
   * Notifies the system that a user has exited.
   * 
   * @param {Object} userInfo - The user information object.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  notifyExit (userInfo) {
    const body = [{
      Data: {
        TimeCreated: (new Date().getTime() / 1000)
      },
      Producer: {
        Id: '\\Hawken-CL142579\\Binaries\\Win32\\HawkenGame-Win32-Shipping.exe',
        Type: 'HawkenGameClient'
      },
      Subject: {
        Id: userInfo.Guid,
        Type: 'Player'
      },
      Timestamp: (new Date().toISOString()),
      Verb: 'ExitClient'
    }]
    const response = this.makeCall('gameClientEvent', { json: body, method: 'POST' }, { requireAuth: true })
    return response
  }

  /**
   * Logs out a user based on their information.
   * 
   * @param {Object} userInfo - The user information object.
   * @returns {Promise<Object>} A promise that resolves to the response object from the API call.
   */
  logout (userInfo) {
    const endpoint = `users/${userInfo.Guid}/accessGrant`
    const body = { AccessGrant: this.accessToken }
    const response = this.makeCall(endpoint, { json: body, method: 'PUT' }, { requireAuth: true })
    return response
  }

  /**
   * Asserts that the response is valid.
   * 
   * @static
   * @param {Object} response - The response object to validate.
   * @param {string} tag - A tag for the error message.
   * @param {Object} [params={}] - Additional parameters.
   * @param {boolean} [params.printStatus=false] - Whether to include the status in the error message.
   * @throws {Error} If the response is invalid.
   */
  static AssertResponse (response, tag, params = {}) {
    const { printStatus = false } = (params || {})
    if (!response) {
      const statusMessage = printStatus ? `Response Status: ${response.Status}` : ''
      throw new Error(`Error retrieving ${tag || 'data'} with no valid response.${statusMessage}`)
    }
  }

  /**
   * Asserts that the response status is valid.
   * 
   * @static
   * @param {Object} response - The response object to validate.
   * @param {string} tag - A tag for the error message.
   * @param {Object} [params={}] - Additional parameters.
   * @param {boolean} [params.checkStatus=true] - Whether to check the status code.
   * @param {boolean} [params.printStatus=false] - Whether to include the status in the error message.
   * @throws {Error} If the response status is invalid.
   */
  static AssertResponseStatus (response, tag, params = {}) {
    const { checkStatus = true, printStatus = false } = (params || {})
    if (!response || !checkStatus || response.Status !== 200) {
      const statusMessage = printStatus ? `Response Status: ${response.Status}` : ''
      throw new Error(`Error retrieving ${tag || 'data'} with no valid response.${statusMessage}`)
    }
  }

  /**
   * Asserts that the response message is valid.
   * 
   * @static
   * @param {Object} response - The response object to validate.
   * @param {string} tag - A tag for the error message.
   * @param {Object} [params={}] - Additional parameters.
   * @param {Array<string>} [params.expected=[]] - Expected messages.
   * @param {Array<string>} [params.match=[]] - Matching messages.
   * @param {boolean} [params.printCurrent=true] - Whether to include the current message in the error message.
   * @throws {Error} If the response message is invalid.
   */
  static AssertResponseMessage (response, tag, params = {}) {
    const { expected = [], match = [], errorMessage, printCurrent = true } = (params || {})
    const responseMessage = response?.Message?.toLowerCase()

    if (expected?.length && !expected.some(x => responseMessage === `${x}`.toLowerCase())) {
      const currentMessage = printCurrent ? ` Response message: ${response.Message}` : ''
      throw new Error(`Invalid ${tag || 'data'} message received.${currentMessage}`)
    }

    if (match?.some(x => responseMessage === `${x}`.toLowerCase())) {
      throw new Error(errorMessage || `Invalid ${tag || 'data'} message received.`)
    }
  }

  /**
   * Asserts that the response contains valid data.
   * 
   * @static
   * @param {Object} response - The response object to validate.
   * @param {string} tag - A tag for the error message.
   * @param {string} [key='Result'] - The key to check in the response.
   * @throws {Error} If the response does not contain valid data.
   */
  static AssertResponseData (response, tag, key = 'Result') {
    if (response && (!isObject(response) || !response[key])) {
      throw new Error(`No ${tag || 'data'} received`)
    }
  }
}


export const MasterServerServerListingSchema = {
  type: 'object',
  required: [
    'userGuid',
    'AllowedRoles',
    'DeveloperData',
    'Endpoint',
    'GameType',
    'GameVersion',
    'IsMatchmakingVisible',
    'IsPublicVisible',
    'LastUpdate',
    'Map',
    'MatchCompletionPercent',
    'MatchId',
    'MaxUsers',
    'MinUsers',
    'Port',
    'Region',
    'ServerName',
    'ServerRanking',
    'ServerScore',
    'Status',
    'Users',
    'VoiceChannelListing',
    'Guid'
  ],
  properties: {
    userGuid: { type: 'string' },
    AllowedRoles: {
      type: 'array',
      items: {
        items: {}
      }
    },
    DeveloperData: {
      type: 'object',
      properties: {
        AveragePilotLevel: { type: 'string' },
        MatchState: { type: 'string' },
        bIgnoreMMR: { type: 'string' },
        bTournament: { type: 'string' },
        PasswordHash: {
          type: 'string'
        }
      },
      required: [
        'AveragePilotLevel',
        'MatchState',
        'bIgnoreMMR',
        'bTournament'
      ]
    },
    Endpoint: { type: 'null' },
    GameType: { type: 'string' },
    GameVersion: { type: 'string' },
    IsMatchmakingVisible: { type: 'boolean' },
    IsPublicVisible: { type: 'boolean' },
    LastUpdate: { type: 'string' },
    Map: { type: 'string' },
    MatchCompletionPercent: {
      type: 'integer',
      minimum: 0
    },
    MatchId: {
      type: 'string',
      pattern: '^[A-Fa-f0-9]{32}$'
    },
    MaxUsers: {
      type: 'integer',
      minimum: 0
    },
    MinUsers: {
      type: 'integer',
      minimum: 0
    },
    Port: {
      type: 'null'
    },
    Region: {
      type: 'string',
      enum: [
        'Asia',
        'Europe',
        'North-America',
        'Oceania'
      ]
    },
    ServerName: { type: 'string' },
    ServerRanking: { type: 'integer' },
    ServerScore: { type: 'string' },
    Status: { type: 'integer' },
    Users: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid'
      }
    },
    VoiceChannelListing: { type: 'string' },
    Guid: {
      type: 'string',
      format: 'uuid'
    }
  }
}

export const MasterServerResponseSchema = {
  type: 'array',
  items: { $ref: '#/$defs/server' },
  $defs: {
    server: MasterServerServerListingSchema
  }
}
