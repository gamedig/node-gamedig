import Core from './core.js'

export default class hytale extends Core {
  async run (state) {
    this.usedTcp = true

    if (!this.options.rejectUnauthorized) this.options.rejectUnauthorized = false

    const response = await this.queryEndpoint()

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

  async queryEndpoint () {
    const url = `http://${this.options.host}:${this.options.port}/Nitrado/Query`

    const requestOptions = {
      url,
      headers: {
        Accept: 'application/json'
      },
      responseType: 'json',
      https: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: this.options.rejectUnauthorized
      }
    }

    return await this.request(requestOptions)
  }
}
