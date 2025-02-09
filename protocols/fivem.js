import quake2 from './quake2.js'

export default class fivem extends quake2 {
  constructor () {
    super()
    this.sendHeader = 'getinfo xxx'
    this.responseHeader = 'infoResponse'
    this.encoding = 'utf8'
  }

  async run (state) {
    await super.run(state)

    {
      const json = await this.request({
        url: 'http://' + this.options.address + ':' + this.options.port + '/info.json',
        responseType: 'json'
      })
      state.raw.info = json
      if ('version' in state.raw.info) state.version = state.raw.info.version
    }

    try {
      // TODO: #674, eventually add `requestPlayers` and `requestPlayersRequired`.
      const json = await this.request({
        url: 'http://' + this.options.address + ':' + this.options.port + '/players.json',
        responseType: 'json'
      })
      state.raw.players = json
      for (const player of json) {
        state.players.push({ name: player.name, ping: player.ping })
      }
    } catch (_) {}
  }
}
