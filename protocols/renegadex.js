import Core from './core.js'

/**
 * Implements the protocol for Renegade X, an UnrealEngine3 based game, using a custom master server
 */
export default class renegadex extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    const servers = await this.request({
      url: 'https://serverlist-rx.totemarts.services/servers.jsp',
      responseType: 'json'
    })

    if (!servers) {
      throw new Error('Unable to retrieve master server list')
    }

    const serverInfo = servers.find(
      (server) =>
        server.IP === this.options.address && server.Port === this.options.port
    )

    if (serverInfo == null) {
      throw new Error('Server not found in master server list')
    }

    let emptyPrefix = ''
    if (serverInfo.NamePrefix) emptyPrefix = serverInfo.NamePrefix + ' '
    const servername = `${emptyPrefix}${serverInfo.Name}`
    const numplayers = serverInfo.Players || 0
    const numbots = serverInfo.Bots || 0
    const variables = serverInfo.Variables || {}

    state.name = servername
    state.map = serverInfo['Current Map']
    state.password = Math.abs(!!variables.bPassworded)

    state.numplayers = numplayers
    state.maxplayers = variables['Player Limit'] || 0

    // due to master server not providing bot/player list, and standard result has no bot count, add list with dummy values
    state.players = Array.from(new Array(numplayers).keys(), (i) => ({ name: `Player #${i + 1}`, raw: {} }))
    state.bots = Array.from(new Array(numbots).keys(), (i) => ({ name: `Bot #${i + 1}`, raw: {} }))

    state.raw = variables
    state.version = serverInfo['Game Version']
  }
}
