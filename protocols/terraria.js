import Core from './core.js'

export default class terraria extends Core {
  async run (state) {
    const json = await this.request({
      url: 'http://' + this.options.address + ':' + this.options.port + '/v2/server/status',
      searchParams: {
        players: 'true',
        token: this.options.token
      },
      responseType: 'json'
    })

    if (json.status !== '200') throw new Error('Invalid status')

    state.raw = json

    for (const one of json.players) {
      state.players.push({ name: one.nickname, team: one.team })
    }

    state.name = json.name
    state.gamePort = json.port
    state.numplayers = json.playercount
    state.maxplayers = json.maxplayers
  }
}
