import Core from './core.js'

export default class altvmp extends Core {
  constructor() {
    super()
    this.usedTcp = true
  }

  async getServerFromMasterList() {
    const targetID = `${this.options.host}:${this.options.port}`

    const results = await this.request({
      url: 'https://api.alt-mp.com/servers',
      responseType: 'json'
    })

    if (results == null) {
      throw new Error('Unable to retrieve master server list')
    }

    const serverInfo = results.find((server) => {
      // If the server uses a CDN, there could be occasional paths in the address, so we are checking for them.
      // If the server does not use a CDN, there will be no paths in the address and direct comparison will work.
      const address = server.useCdn
        ? server.address
        : server.address.replace(/(https?:\/\/)?\/?/g, '')
      return address === targetID
    })

    return serverInfo
  }

  async getServerById(targetID) {
    const serverInfo = await this.request({
      url: `https://api.alt-mp.com/servers/${targetID}`,
      responseType: 'json'
    })

    if (serverInfo == null) {
      throw new Error('Unable to retrieve server info')
    }

    return serverInfo
  }

  async run(state) {
    const serverInfo = this.options.serverId
      ? await this.getServerById(this.options.serverId)
      : await this.getServerFromMasterList()

    if (!serverInfo) {
      throw new Error('No server info was found.')
    }

    state.name = serverInfo.name
    state.numplayers = serverInfo.playersCount
    state.maxplayers = serverInfo.maxPlayersCount
    state.password = serverInfo.passworded
    state.version = serverInfo.version
    state.connect = `altv://${serverInfo.address}`
    state.raw = serverInfo
  }
}
