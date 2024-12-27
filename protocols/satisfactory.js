import Core from './core.js'

export default class satisfactory extends Core {
  constructor () {
    super()

    // Don't use the tcp ping probing
    this.usedTcp = true
  }

  async run (state) {
    const packet = Buffer.from([0xD5, 0xF6, 0, 1, 5, 5, 5, 5, 5, 5, 5, 5, 1])
    const response = await this.udpSend(packet, packet => {
      const reader = this.reader(packet)
      const header = reader.part(4)
      if (header.equals(Buffer.from([0xD5, 0xF6, 1, 2]))) return
      reader.skip(8) // skip the cookie
      return reader
    })

    state.raw.serverState = response.int(1)
    state.version = response.int(4).toString()
    state.raw.serverFlags = response.int(8)

    const subStatesCount = response.int(1)
    response.skip(subStatesCount * 3)

    const nameLength = response.int(2)
    state.name = response.part(nameLength).toString('utf-8')

    try {
      await this.doHttpApiQueries(state)
    } catch (e) {
      this.logger.debug('HTTP API query failed.')
      this.logger.debug(e)
    }
  }

  async doHttpApiQueries (state) {
    const headers = {
      'Content-Type': 'application/json'
    }

    /**
     *  Satisfactory servers unless specified use self-signed certificates for the HTTPS API.
     *  Because of this we default the `rejectUnauthorized` flag to `false` unless set.
     *  For more information see GAMES_LIST.md
     */
    if (!this.options.rejectUnauthorized) this.options.rejectUnauthorized = false

    let token = this.options.token
    if (!token) {
      const tokenRequestJson = {
        function: 'PasswordlessLogin',
        data: {
          MinimumPrivilegeLevel: 'Client'
        }
      }

      const response = await this.queryInfo(tokenRequestJson, headers)
      token = response.authenticationToken
    }

    const queryJson = {
      function: 'QueryServerState'
    }

    const queryResponse = await this.queryInfo(queryJson, {
      ...headers,
      Authorization: `Bearer ${token}`
    })

    /**
     *  Satisfactory API cannot pull Server Name at the moment, see QA and vote for fix here
     *  https://questions.satisfactorygame.com/post/66ebebad772a987f4a8b9ef8
     */

    state.numplayers = queryResponse.serverGameState.numConnectedPlayers
    state.maxplayers = queryResponse.serverGameState.playerLimit
    state.raw.http = queryResponse
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
      return response.data
    }
  }
}
