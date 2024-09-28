import Core from './core.js'

const extractValue = (text, regex, defaultValue, parser = (val) => val) => {
  const match = text.match(regex)
  return match ? parser(match[1] || defaultValue) : defaultValue
}

export default class soldat extends Core {
  async run (state) {
    const data = await this.withTcp(async socket => {
      return await this.tcpSend(socket, 'STARTFILES\r\nlogs/gamestat.txt\r\nENDFILES\r\n', (data) => {
        const asString = data.toString()
        if (asString.endsWith('\r\n') && !asString.endsWith('ENDFILES\r\n')) {
          return undefined
        }
        return data
      })
    })

    const string = data.toString()

    state.numplayers = extractValue(string, /Players:\s*(\d+)/, 0, Number)
    state.map = extractValue(string, /Map:\s*(.+)/, '')

    const lines = string.trim().split('\n')
    const playersIndex = lines.findIndex(line => line.startsWith('Players list'))

    if (playersIndex > -1) {
      for (let i = playersIndex + 1; i < lines.length - 1; i += 5) {
        state.players.push({
          name: lines[i].trim(),
          raw: {
            kills: parseInt(lines[i + 1].trim()),
            deaths: parseInt(lines[i + 2].trim()),
            team: parseInt(lines[i + 3].trim()),
            ping: parseInt(lines[i + 4].trim())
          }
        })
      }
    }

    state.raw.response = string
    state.raw.gamemode = extractValue(string, /Gamemode:\s*(.+)/, '')
  }
}
