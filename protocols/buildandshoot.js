import Core from './core.js'

export default class buildandshoot extends Core {
  async run (state) {
    const request = await this.request({
      url: 'http://' + this.options.address + ':' + this.options.port + '/json',
      responseType: 'json'
    })

    state.name = request.serverName
    state.map = request.map.name;
    state.numplayers = request.players?.length || 0;
    state.maxplayers = request.maxPlayers;

    state.version = request.serverVersion;

    state.raw = request || {};

    // Backwards compatibility
    state.raw.uptime = request.serverUptime;

    state.players = [];

    for (const player of request.players) {
      // for backwards compatibility we have added latency and ping as the same value and score as kills
      state.players.push({
        name: player.name,
        latency: player.latency,
        ping: player.latency,
        team: player.team,
        score: player.score,
        kills: player.score
      })
    }
  }
}
