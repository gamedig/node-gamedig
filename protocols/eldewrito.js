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

    state.name = json.name
    state.map = json.map
    state.maxplayers = json.maxPlayers
    state.connect = this.options.address + ':' + json.port

    state.raw = json
    if ('eldewritoVersion' in state.raw) state.version = state.raw.eldewritoVersion
  }
}
