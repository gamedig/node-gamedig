import Core from './core.js'

export default class kspdmp extends Core {
  async run (state) {
    const json = await this.request({
      url: 'http://' + this.options.address + ':' + this.options.port,
      responseType: 'json'
    })

    for (const one of json.players) {
      state.players.push({ name: one.nickname, team: one.team })
    }

    for (const key of Object.keys(json)) {
      state.raw[key] = json[key]
    }
    state.name = json.server_name
    state.maxplayers = json.max_players
    state.gamePort = json.port
    if (json.players) {
      const split = json.players.split(', ')
      for (const name of split) {
        state.players.push({ name })
      }
    }
    state.numplayers = state.players.length
  }
}
