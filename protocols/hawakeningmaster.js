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
  makeCall (endpoint, requestParams, callParams) {
    const { requireAuth = false } = callParams

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
    const response = this.makeCall('status/services', {}, { requireAuth: true })
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
    const response = this.makeCall(endpoint, { json: body, method: 'POST', headers: { myheader: 'test' } }, { requireAuth: true })
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
   * @param {boolean} [params.printCurrent=true] - Whether to include the current message in the error message.
   * @throws {Error} If the response message is invalid.
   */
  static AssertResponseMessage (response, tag, params = {}) {
    const { expected = [], printCurrent = true } = (params || {})
    const responseMessage = response?.Message?.toLowerCase()

    if (!expected?.some(x => responseMessage === `${x}`.toLowerCase())) {
      const currentMessage = printCurrent ? `Response message: ${response.Message}` : ''
      throw new Error(`Invalid ${tag || 'data'} message received.${currentMessage}`)
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
