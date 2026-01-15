import Core from './core.js'

export default class hytale extends Core {
  async run (state) {
    this.usedTcp = true

    // Hytale servers commonly use self-signed certificates for HTTPS.
    // We default rejectUnauthorized to false unless explicitly set.
    if (this.options.rejectUnauthorized === undefined) {
      this.options.rejectUnauthorized = false
    }

    let response
    // Try HTTPS first (most common), fall back to HTTP
    try {
      response = await this.queryEndpoint('https')
    } catch (e) {
      this.logger.debug('HTTPS query failed, trying HTTP')
      this.logger.debug(e)
      response = await this.queryEndpoint('http')
    }

    if (response.Server) {
      state.name = response.Server.Name
      state.version = response.Server.Version
      state.maxplayers = response.Server.MaxPlayers
      state.raw.server = response.Server
    }

    if (response.Universe) {
      state.numplayers = response.Universe.CurrentPlayers
      state.map = response.Universe.DefaultWorld
      state.raw.universe = response.Universe
    }

    if (response.Players) {
      state.players = response.Players.map(player => ({
        name: player.Name,
        raw: {
          uuid: player.UUID,
          world: player.World
        }
      }))
    }

    if (response.Plugins) {
      state.raw.plugins = response.Plugins
    }
  }

  async queryEndpoint (protocol) {
    const url = `${protocol}://${this.options.host}:${this.options.port}/Nitrado/Query`

    const requestOptions = {
      url,
      headers: {
        Accept: 'application/json'
      },
      responseType: 'json'
    }

    if (protocol === 'https') {
      requestOptions.https = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: this.options.rejectUnauthorized
      }
    }

    return await this.request(requestOptions)
  }
}
