import Core from './core.js'
import beammpmaster from './beammpmaster.js'

export default class beammp extends Core {
  async run (state) {
    const master = new beammpmaster()
    master.options = this.options
    const masterState = await master.runOnceSafe()
    const servers = masterState.raw.servers
    const server = servers.find(s => s.ip === this.options.address)

    if (!server) {
      throw new Error('Server not found in the master list')
    }

    state.name = server.sname.replace(/\^./g, '')
    state.map = server.map
    state.password = server.password
    state.numplayers = parseInt(server.players)
    state.maxplayers = parseInt(server.maxplayers)

    const players = server.playerslist.split(';')
    if (players[players.length - 1] === '') {
      players.pop()
    }
    players.forEach(player => {
      state.players.push({ name: player })
    })

    state.raw = server
    if ('version' in state.raw) state.version = state.raw.version
  }
}
