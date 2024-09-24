import Core from './core.js'

/**
 * Satisfactory servers run by default self-signed certificates. This is used to ignore the validation for the requests.
 */
const https = {
  rejectUnauthorized: false
}

export default class satisfactory extends Core {
  constructor () {
    super()

    /**
     * To get information about the Satisfactory game server, you need to first obtain a client authenticationToken.
     * https://satisfactory.wiki.gg/wiki/Dedicated_servers/HTTPS_API
     */

    this.authenticationToken = null

    // Don't use the tcp ping probing
    this.usedTcp = true

  }

  async run (state) {
    await this.getClientAuthenticationToken()

    await this.queryInfo(state)
    await this.cleanup(state)
  }

  async getClientAuthenticationToken () {
    this.logger.debug('Requesting client access token ...')

    const url = `https://${this.options.host}:${this.options.port}/api/v1/`

    const json = {
      function: 'PasswordlessLogin',
      data: {
        MinimumPrivilegeLevel: 'Client'
      }
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    this.logger.debug(`POST: ${url}`)
    const response = await this.request({ url, json, https, headers, method: 'POST', responseType: 'json' })

    if (response.data == null) {
      throw new Error('Unable to retrieve authenticationToken')
    }

    this.authenticationToken = response.data.authenticationToken
  }

  async queryInfo (state) {
    const url = `https://${this.options.host}:${this.options.port}/api/v1/`

    const json = {
      function: 'QueryServerState'
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authenticationToken}`
    }

    this.logger.debug(`POST: ${url}`)
    const response = await this.request({ url, json, https, headers, method: 'POST', responseType: 'json' })

    if (response.data == null) {
      throw new Error('Unable to retrieve serverGameState')
    }

    /**
     *  Satisfactory API cannot pull Server Name at the moment, see QA and vote for fix here
     *  https://questions.satisfactorygame.com/post/66ebebad772a987f4a8b9ef8
     */

    state.numplayers = response.data.serverGameState.numConnectedPlayers
    state.maxplayers = response.data.serverGameState.playerLimit

    state.raw = response
  }

  async cleanup (state) {
    this.authenticationToken = null
  }
}
