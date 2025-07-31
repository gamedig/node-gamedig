import Core from './core.js'

const USER_AGENT = 'Mozilla/5.0 (compatible; Gamedig/3.0; +https://github.com/gamedig/gamedig)'

export default class vintagestorymaster extends Core {
  constructor () {
    super()
    this.usedTcp = true
  }

  async run (state) {
    // Vintage Story master server returns 403 unless a valid User-Agent header is provided
    const response = await this.request({
      url: 'https://masterserver.vintagestory.at/api/v1/servers/list',
      responseType: 'json',
      headers: {
        'User-Agent': USER_AGENT
      }
    })

    state.raw.servers = response?.data || []
  }
}