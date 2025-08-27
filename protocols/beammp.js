import Core from './core.js'
import beammpmaster from './beammpmaster.js'

export default class beammp extends Core {
  async run (state) {
    const master = new beammpmaster()
    master.options = this.options
    const masterState = await master.runOnceSafe()
    const servers = masterState.raw.servers
    const sameIpServers = servers.filter(s => s.ip === this.options.address)
    const sortedServers = sameIpServers.sort(s => parseInt(s.port))
    // Cause some don't have ports specified, so we prioritize those who do
    const server = sortedServers.find(s => s.ip === this.options.address && this.matchPort(s.port))

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

  matchPort (givenPort) {
    const parsedPort = parseInt(givenPort)
    const port = this.options.port
    if (!port || isNaN(parsedPort)) {
      return true
    }

    return port === parsedPort
  }
}
