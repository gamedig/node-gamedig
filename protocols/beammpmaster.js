import Core from './core.js'

export default class beammpmaster extends Core {
  constructor () {
    super()

    // Don't use the tcp ping probing
    this.usedTcp = true
  }

  async run (state) {
    state.raw.servers = await this.request({
      url: 'https://backend.beammp.com/servers-info',
      responseType: 'json'
    })
  }
}
