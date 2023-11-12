import Core from './core.js'
import axios from 'axios'

export default class Epic extends Core {
  constructor () {
    super()

    /**
     * To get information about game servers using Epic's EOS, you need some credentials to authenticate using OAuth2.
     *
     * https://dev.epicgames.com/docs/web-api-ref/authentication
     *
     * These credentials can be provided by the game developers or extracted from the game's files.
     */
    this.clientId = null
    this.clientSecret = null
    this.deploymentId = null
    this.epicApi = 'https://api.epicgames.dev'
    this.accessToken = null
  }

  async run (state) {
    await this.getAccessToken()
    await this.queryInfo(state)
    await this.cleanup(state)
  }

  async getAccessToken () {
    this.logger.debug('Requesting acess token ...')

    const url = `${this.epicApi}/auth/v1/oauth/token`
    const body = `grant_type=client_credentials&deployment_id=${this.deploymentId}`
    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    this.logger.debug(`POST: ${url}`)
    const response = await axios.post(url, body, { headers })
    if (response.status !== 200) {
      throw new Error('Failed to get OAuth token')
    }

    this.accessToken = response.data.access_token
  }

  async queryInfo (state) {
    const url = `${this.epicApi}/matchmaking/v1/${this.deploymentId}/filter`
    const body = {
      criteria: [
        {
          key: 'attributes.ADDRESS_s',
          op: 'EQUAL',
          value: this.options.address
        }
      ]
    }
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.accessToken}`
    }

    this.logger.debug(`POST: ${url}`)
    const response = await axios.post(url, body, { headers })
    if (response.status !== 200) {
      throw new Error('Failed to get server info')
    }

    const reader = response.data

    // Epic returns a list of sessions, we need to find the one with the desired port.
    const hasDesiredPort = (session) => session.attributes.ADDRESSBOUND_s === `0.0.0.0:${this.options.port}` ||
      session.attributes.ADDRESSBOUND_s === `${this.options.address}:${this.options.port}`

    const desiredServer = reader.sessions.find(hasDesiredPort)

    if (!desiredServer) {
      throw new Error('Server not found')
    }

    state.name = desiredServer.attributes.CUSTOMSERVERNAME_s
    state.map = desiredServer.attributes.MAPNAME_s
    state.password = desiredServer.attributes.SERVERPASSWORD_b
    state.maxplayers = desiredServer.settings.maxPublicPlayers

    // If the game returns the player list, we can use it otherwise we use the total players.
    if (desiredServer.totalPlayers === desiredServer.publicPlayers.length) {
      for (const player of desiredServer.publicPlayers) {
        state.players.push({
          name: player.name,
          raw: player
        })
      }
    } else {
      for (let i = 0; i < desiredServer.totalPlayers; i++) {
        state.players.push('')
      }
    }

    state.raw = desiredServer
  }

  async cleanup (state) {
    this.accessToken = null
  }
}
