import Core from './core.js'

export default class buildandshoot extends Core {
  async run (state) {
    const body = await this.request({
      url: 'http://' + this.options.address + ':' + this.options.port + '/'
    })

    let m

    m = body.match(/status server for (.*?)\.?[\r\n]/)
    if (m) state.name = m[1]

    m = body.match(/Current uptime: (\d+)/)
    if (m) state.raw.uptime = m[1]

    m = body.match(/currently running (.*?) by /)
    if (m) state.map = m[1]

    m = body.match(/Current players: (\d+)\/(\d+)/)
    if (m) {
      state.numplayers = parseInt(m[1])
      state.maxplayers = m[2]
    }

    m = body.match(/aos:\/\/[0-9]+:[0-9]+/)
    if (m) {
      state.connect = m[0]
    }

    const playerListRegex = /<tr>(.*?)<\/tr>/g
    let playerMatch
    while ((playerMatch = playerListRegex.exec(body)) !== null) {
      const playerRow = playerMatch[1]
      const cols = playerRow.match(/<td.*?>(.*?)<\/td>/g)
      if (cols && cols.length > 1 && !cols[0].includes('colspan')) {
        state.players.push({
          name: cols[2].replace(/<.*?>/g, '').trim(),
          ping: cols[3].replace(/<.*?>/g, '').trim(),
          team: cols[4].replace(/<.*?>/g, '').toLowerCase().trim(),
          score: parseInt(cols[5].replace(/<.*?>/g, '').trim())
        })
      }
    }
  }
}
