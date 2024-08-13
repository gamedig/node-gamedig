import Core from './core.js'

export default class vintagestorymaster extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    const response = await this.request({
      url: 'https://masterserver.vintagestory.at/api/v1/servers/list',
      responseType: 'json'
    })

    state.raw.servers = response?.data || []
  }
}
