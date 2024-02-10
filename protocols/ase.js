import Core from './core.js'

export default class ase extends Core {
  async run (state) {
    const buffer = await this.udpSend('s', (buffer) => {
      const reader = this.reader(buffer)
      const header = reader.string(4)
      if (header === 'EYE1') return reader.rest()
    })

    const reader = this.reader(buffer)
    state.raw.gamename = this.readString(reader)
    state.gamePort = parseInt(this.readString(reader))
    state.name = this.readString(reader)
    state.raw.gametype = this.readString(reader)
    state.map = this.readString(reader)
    state.version = this.readString(reader)
    state.password = this.readString(reader) === '1'
    state.numplayers = parseInt(this.readString(reader))
    state.maxplayers = parseInt(this.readString(reader))

    while (!reader.done()) {
      const key = this.readString(reader)
      if (!key) break
      const value = this.readString(reader)
      state.raw[key] = value
    }

    while (!reader.done()) {
      const flags = reader.uint(1)
      const player = {}
      if (flags & 1) player.name = this.readString(reader)
      if (flags & 2) player.team = this.readString(reader)
      if (flags & 4) player.skin = this.readString(reader)
      if (flags & 8) player.score = parseInt(this.readString(reader))
      if (flags & 16) player.ping = parseInt(this.readString(reader))
      if (flags & 32) player.time = parseInt(this.readString(reader))
      state.players.push(player)
    }
  }

  readString (reader) {
    return reader.pascalString(1, -1)
  }
}
