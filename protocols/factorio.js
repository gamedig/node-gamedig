import Core from './core.js'

export default class factorio extends Core {
  async run (state) {
    if (!this.options.port) this.options.port = 34197

    // Don't use the tcp ping probing
    this.usedTcp = true

    const request = await this.request({
        url: `https://multiplayer.factorio.com/get-game-details/${this.options.address}:${this.options.port}`,
        responseType: 'json'
      })

    const serverInfo = request

    state.name = serverInfo.name
    state.password = serverInfo.has_password
    state.numplayers = serverInfo.players?.length || 0 // players is undefined if there are no players
    state.maxplayers = serverInfo.max_players
    state.players = serverInfo.players?.map(player => ({ name: player, raw: {} })) || []
    
    state.raw = serverInfo
  }
}
