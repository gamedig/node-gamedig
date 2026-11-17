import Epic from './epic.js'

export default class asa extends Epic {
  constructor () {
    super()

    // OAuth2 credentials extracted from ARK: Survival Ascended files.
    this.clientId = 'xyza7891muomRmynIIHaJB9COBKkwj6n'
    this.clientSecret = 'PP5UGxysEieNfSrEicaD1N2Bb3TdXuD7xHYcsdUHZ7s'
    this.deploymentId = 'ad9a8feffb3b4b2ca315546f038c3ae2'
    this.wildcardMatchmaking = true

    this.cdnLists = [
      'https://cdn2.arkdedicated.com/servers/asa/officialserverlist.json',
      'https://cdn2.arkdedicated.com/servers/asa/unofficialserverlist.json'
    ]
  }

  async run (state) {
    await super.run(state)
    state.version = state.raw.attributes.BUILDID_s + '.' + state.raw.attributes.MINORBUILDID_s
  }

  async queryInfo (state) {
    const sessionId = await this.findSessionId()
    const session = await this.getSessionById(sessionId)

    state.name = session.attributes.CUSTOMSERVERNAME_s
    state.map = session.attributes.MAPNAME_s
    state.password = session.attributes.SERVERPASSWORD_b
    state.numplayers = session.totalPlayers
    state.maxplayers = session.settings.maxPublicPlayers

    for (const player of session.publicPlayers) {
      state.players.push({ name: player.name, raw: player })
    }

    state.raw = session
  }

  async findSessionId () {
    if (this.options.token) {
      this.logger.debug(`Using provided session ID: ${this.options.token}`)
      return this.options.token
    }

    for (const url of this.cdnLists) {
      this.logger.debug(`Fetching server list: ${url}`)
      const servers = await this.request({ url, responseType: 'json' })

      const match = servers.find(s =>
        s.IP === this.options.address && s.Port === this.options.port
      )
      if (match) {
        this.logger.debug(`Found session ID: ${match.SessionID}`)
        return match.SessionID
      }
    }

    throw new Error('Server not found in ARK CDN server lists. For private servers, provide the EOS "session ID" via --token.')
  }

  async getSessionById (sessionId) {
    const url = `${this.epicApi}/wildcard/matchmaking/v1/${this.deploymentId}/sessions/${sessionId}`
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: 'application/json'
    }

    this.logger.debug(`GET: ${url}`)
    const response = await this.request({ url, headers, responseType: 'json' })
    return response.publicData
  }
}
