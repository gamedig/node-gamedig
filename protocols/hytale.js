import Core from './core.js'

export default class hytale extends Core {
  async run (state) {
    this.usedTcp = true

    const response = await this.queryEndpoint()

    state.raw.basic = response.Basic

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
        raw: player
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
      responseType: 'json'
    }

    return await this.request(requestOptions)
  }
}
