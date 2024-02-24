import Core from './core.js'
import cheerio from 'cheerio'

export default class farmingsimulator extends Core {
  async run (state) {
    if (!this.options.port) this.options.port = 8080
    if (!this.options.token) throw new Error(`No token provided. You can get it from http://${this.options.host}:${this.options.port}/settings.html`)

    const request = await this.request({
      url: `http://${this.options.host}:${this.options.port}/feed/dedicated-server-stats.xml?code=${this.options.token}`,
      responseType: 'text'
    })

    const $ = cheerio.load(request, {
      xmlMode: true
    })

    const serverInfo = $('Server')
    const playerInfo = serverInfo.find('Slots')

    state.name = serverInfo.attr('name')
    state.map = serverInfo.attr('mapName')
    state.numplayers = playerInfo.attr('numUsed')
    state.maxplayers = playerInfo.attr('capacity')

    $('Player').each(function () {
      if ($(this).attr('isUsed') === 'true') {
        state.players.push({
          name: $(this).text(),
          raw: {
            isAdmin: $(this).attr('isAdmin') === 'true',
            uptime: parseInt($(this).attr('uptime'), 10)
          }
        })
      }
    })

    state.raw.mods = []
    $('Mod').each(function () {
      if ($(this).attr('name') !== undefined) {
        state.raw.mods.push({
          name: $(this).text(),
          short_name: $(this).attr('name'),
          author: $(this).attr('author'),
          version: $(this).attr('version'),
          hash: $(this).attr('hash')
        })
      }
    })

    state.version = serverInfo.attr('version')

    // TODO: Add state.raw
  }
}
