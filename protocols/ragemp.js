import Core from './core.js'

export default class ragemp extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    const results = await this.request({
      url: 'https://cdn.rage.mp/master/v2/',
      responseType: 'json'
    })

    if (results == null) {
      throw new Error('Unable to retrieve master server list')
    }

    const targetID = `${this.options.host}:${this.options.port}`

    let serverResult = null
    let serverInfo = null

    for (const entry of results) {
      if (entry.id === targetID) {
        serverResult = entry
        serverInfo = entry.servers.at(0)
        break
      }

      for (const serverEntry of entry.servers) {
        if (serverEntry.id === targetID) {
          serverResult = entry
          serverInfo = serverEntry
          break
        }
      }
    }

    if (serverInfo == null) {
      throw new Error('Server not found in master server list.')
    }

    state.name = serverInfo.name
    state.numplayers = serverInfo.players.amount
    state.maxplayers = serverInfo.players.max
    state.raw = serverResult
  }
}
