import Core from './core.js'

export default class eldewrito extends Core {
  async run (state) {
    const json = await this.request({
      url: 'http://' + this.options.address + ':' + this.options.port,
      responseType: 'json'
    })

    for (const one of json.players) {
        state.players.push({ name: one.name, team: one.team })
      }

    
    state.gameState = json.status
    state.gamePort = json.port
    state.numplayers = json.numPlayers
    state.maxplayers = json.maxPlayers
    state.map = json.map
    state.variant = json.variant
    state.name = json.name
  }
}