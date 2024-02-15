import Core from './core.js'

export default class teamspeak2 extends Core {
  async run (state) {
    const queryPort = this.options.teamspeakQueryPort || 51234

    await this.withTcp(async socket => {
      {
        const data = await this.sendCommand(socket, 'sel ' + this.options.port)
        if (data !== '[TS]') throw new Error('Invalid header')
      }

      {
        const data = await this.sendCommand(socket, 'si')
        for (const line of data.split('\r\n')) {
          const equals = line.indexOf('=')
          const key = equals === -1 ? line : line.substring(0, equals)
          const value = equals === -1 ? '' : line.substring(equals + 1)
          state.raw[key] = value
        }
        if ('server_name' in state.raw) state.name = state.raw.server_name
      }

      {
        const data = await this.sendCommand(socket, 'pl')
        const split = data.split('\r\n')
        const fields = split.shift().split('\t')
        for (const line of split) {
          const split2 = line.split('\t')
          const player = {}
          split2.forEach((value, i) => {
            let key = fields[i]
            if (!key) return
            if (key === 'nick') key = 'name'
            const m = value.match(/^"(.*)"$/)
            if (m) value = m[1]
            player[key] = value
          })
          state.players.push(player)
        }
        state.numplayers = state.players.length
      }

      {
        const data = await this.sendCommand(socket, 'cl')
        const split = data.split('\r\n')
        const fields = split.shift().split('\t')
        state.raw.channels = []
        for (const line of split) {
          const split2 = line.split('\t')
          const channel = {}
          split2.forEach((value, i) => {
            const key = fields[i]
            if (!key) return
            const m = value.match(/^"(.*)"$/)
            if (m) value = m[1]
            channel[key] = value
          })
          state.raw.channels.push(channel)
        }
      }
    }, queryPort)
  }

  async sendCommand (socket, cmd) {
    return await this.tcpSend(socket, cmd + '\x0A', buffer => {
      if (buffer.length < 6) return
      if (buffer.slice(-6).toString() !== '\r\nOK\r\n') return
      return buffer.slice(0, -6).toString()
    })
  }
}
