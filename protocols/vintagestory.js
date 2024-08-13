import Core from './core.js'
import vintagestorymaster from './vintagestorymaster.js'

export default class vintagestory extends Core {
  async run (state) {
    const master = new vintagestorymaster()
    master.options = this.options
    const masterState = await master.runOnceSafe()
    const servers = masterState.raw.servers
    const server = servers.find(s => s.serverIP === `${this.options.address}:${this.options.port}`)

    if (!server) {
      throw new Error('Server not found in the master list')
    }

    state.name = server.serverName
    state.password = server.hasPassword
    state.numplayers = parseInt(server.players)
    state.maxplayers = parseInt(server.maxPlayers)
    state.version = server.gameVersion

    state.raw = server
  }
}
