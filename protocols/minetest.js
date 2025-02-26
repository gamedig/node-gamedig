import Core from './core.js'

export default class minetest extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    const servers = await this.request({
      url: 'https://servers.minetest.net/list',
      responseType: 'json'
    })

    if (servers == null) {
      throw new Error('Unable to retrieve master server list')
    }

    const serverInfo = servers.list.find(
      (server) =>
        server.address === this.options.address && server.port === this.options.port
    )

    if (serverInfo == null) {
      throw new Error('Server not found in master server list')
    }

    const players = serverInfo.clients_list || [] // the 'players' field is undefined if there are no players

    state.name = serverInfo.name
    state.password = serverInfo.password
    state.numplayers = serverInfo.clients || players.length
    state.maxplayers = serverInfo.clients_max
    state.players = players.map((player) => ({ name: player, raw: {} }))

    state.raw = serverInfo
    state.version = serverInfo.version
  }
}
