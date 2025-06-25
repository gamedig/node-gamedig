import Core from './core.js'

export default class scpsl extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    const { accountId, apiKey, serverId } = this.options

    const request = await this.request({
      url: 'https://api.scpslgame.com/serverinfo.php',
      responseType: 'json',
      searchParams: {
        id: accountId,
        key: apiKey,
        lo: true,
        players: true,
        list: true,
        info: true,
        pastebin: true,
        version: true,
        flags: true,
        nicknames: true,
        online: true
      }
    })

    state.raw.request = request

    if (!serverId) {
      return
    }

    const servers = request?.Servers || []
    if (!servers.length) {
      throw new Error('No servers provided.')
    }

    const server = servers.find(server => server.ID.toString() === serverId)

    if (!server) {
      throw new Error('Couldn\'t find the given server id.')
    }

    state.version = server.Version
    state.name = Buffer.from(server.Info, 'base64').toString()

    const [numplayers, maxplayers] = server.Players.split('/').map(Number)
    state.numplayers = numplayers
    state.maxplayers = maxplayers
  }
}
