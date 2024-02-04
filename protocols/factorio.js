import Core from './core.js'

export default class factorio extends Core {
  async run (state) {
    if (!this.options.port) this.options.port = 34197
    this.usedTcp = true

    const serverInfo = await this.request({
      url: `https://multiplayer.factorio.com/get-game-details/${this.options.address}:${this.options.port}`,
      responseType: 'json'
    })

    const players = serverInfo.players || [] // the 'players' field is undefined if there are no players

    state.name = serverInfo.name
    state.password = serverInfo.has_password
    state.numplayers = players.length
    state.maxplayers = serverInfo.max_players
    state.players = players.map(player => ({ name: player, raw: {} }))

    state.raw = serverInfo
    state.version = state.raw.application_version.game_version + '.' + state.raw.application_version.build_version
  }
}
