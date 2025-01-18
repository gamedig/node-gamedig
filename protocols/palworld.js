import Core from './core.js'

export default class palworld extends Core {
  async makeCall (endpoint) {
    const url = `http://${this.options.host}:${this.options.port}/v1/api/${endpoint}`
    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.options.username}:${this.options.password}`).toString('base64')}`,
      Accept: 'application/json'
    }

    return await this.request({ url, headers, method: 'GET', responseType: 'json' })
  }

  async run (state) {
    const serverInfo = await this.makeCall('info')
    state.version = serverInfo.version
    state.name = serverInfo.servername
    state.raw.serverInfo = serverInfo

    const { players } = await this.makeCall('players')
    state.numplayers = players.length
    state.players = players.map((player) => ({ name: player.name, raw: player }))
    state.raw.players = players

    state.raw.settings = await this.makeCall('settings')

    const metrics = await this.makeCall('metrics')
    state.numplayers = metrics.currentplayernum
    state.maxplayers = metrics.maxplayernum
    state.raw.metrics = metrics
  }
}
