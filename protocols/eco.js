import Core from './core.js'

export default class eco extends Core {
  async run (state) {
    if (!this.options.port) this.options.port = 3001

    const request = await this.request({
      url: `http://${this.options.host}:${this.options.port}/frontpage`,
      responseType: 'json'
    })
    const serverInfo = request.Info

    state.name = serverInfo.Description
    state.numplayers = serverInfo.OnlinePlayers
    state.maxplayers = serverInfo.TotalPlayers
    state.password = serverInfo.HasPassword
    state.gamePort = serverInfo.GamePort
    state.players = serverInfo.OnlinePlayersNames?.map(name => ({ name, raw: {} })) || []
    state.raw = serverInfo
    state.version = state.raw.Version
  }
}
