import Core from './core.js'

export default class satisfactory extends Core {
  constructor () {
    super()

    // Don't use the tcp ping probing
    this.usedTcp = true

  }

  async run (state) {

    /**
     * To get information about the Satisfactory game server, you need to first obtain a client authenticationToken.
     * https://satisfactory.wiki.gg/wiki/Dedicated_servers/HTTPS_API
     */

    const tokenRequestJson = {
      function: 'PasswordlessLogin',
      data: {
        MinimumPrivilegeLevel: 'Client'
      }
    }

    const queryJson = {
      function: 'QueryServerState'
    }

    let headers = {
      'Content-Type': 'application/json'
    }

    /**
     *  Satisfactory servers unless specified use self-signed certificates for the HTTPS API.
     *  Because of this we default the `rejectUnauthorized` flag to `false` unless set.
     *  For more information see GAMES_LIST.md
     */
    if (!this.options.rejectUnauthorized) this.options.rejectUnauthorized = false

    let tokenRequestResponse = await this.queryInfo(tokenRequestJson, headers)

    headers.Authorization = `Bearer ${tokenRequestResponse.data.authenticationToken}`

    let queryResponse = await this.queryInfo(queryJson, headers)

    /**
     *  Satisfactory API cannot pull Server Name at the moment, see QA and vote for fix here
     *  https://questions.satisfactorygame.com/post/66ebebad772a987f4a8b9ef8
     */

    state.numplayers = queryResponse.data.serverGameState.numConnectedPlayers
    state.maxplayers = queryResponse.data.serverGameState.playerLimit
    state.raw = queryResponse

  }

  async queryInfo (json, headers) {

    const url = `https://${this.options.host}:${this.options.port}/api/v1/`

    this.logger.debug(`POST: ${url}`)

    const response = await this.request({
      url,
      json,
      headers,
      method: 'POST',
      responseType: 'json',
      https: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: this.options.rejectUnauthorized
      }
    })

    if (response.data == null) {
      throw new Error('Unable to retrieve data from server')
    } else {
      return response
    }
  }
}
