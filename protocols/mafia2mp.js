import Core from './core.js'

export default class mafia2mp extends Core {
  constructor () {
    super()
    this.encoding = 'latin1'
    this.header = 'M2MP'
    this.isMafia2Online = false
  }

  async run (state) {
    const body = await this.udpSend(this.header, (buffer) => {
      const reader = this.reader(buffer)
      const header = reader.string(this.header.length)
      if (header !== this.header) return
      return reader.rest()
    })

    const reader = this.reader(body)
    state.name = this.readString(reader)
    state.numplayers = parseInt(this.readString(reader))
    state.maxplayers = parseInt(this.readString(reader))
    state.raw.gamemode = this.readString(reader)
    state.version = state.raw.gamemode
    state.password = !!reader.uint(1)
    state.gamePort = this.options.port - 1

    while (!reader.done()) {
      const player = {}
      player.name = this.readString(reader)
      if (!player.name) break
      if (this.isMafia2Online) {
        player.ping = parseInt(this.readString(reader))
      }
      state.players.push(player)
    }
  }

  readString (reader) {
    return reader.pascalString(1, -1)
  }
}
