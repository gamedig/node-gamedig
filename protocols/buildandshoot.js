import Core from './core.js'

// We are doing some shenanigans here as we are trying to support the stable version and the git master version
// as in the latest (0.75) releases they are mixed up.
export default class buildandshoot extends Core {
  async run (state) {
    const request = await this.request({
      url: 'http://' + this.options.address + ':' + this.options.port + '/json',
      responseType: 'json'
    })

    state.name = request.serverName
    state.map = request.map.name
    state.version = request.serverVersion

    const bluePlayers = request.players?.blue || []
    const greenPlayers = request.players?.green || []
    let players = bluePlayers.concat(greenPlayers)
    if (Array.isArray(request.players)) {
      players = players.concat(request.players)
    }

    state.numplayers = players.length
    state.maxplayers = request.maxPlayers || request.players?.maxPlayers

    state.players = []
    for (const player of players) {
      if (typeof player === 'string') {
        state.players.push({
          name: player
        })
      } else {
        state.players.push({
          ...player,
          name: player.name
        })
      }
    }

    state.raw = request
  }
}
