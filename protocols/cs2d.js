import Core from './core.js'

export default class cs2d extends Core {
  async run (state) {
    const reader = await this.sendQuery(
      Buffer.from('\x01\x00\xFB\x01\xF5\x03\xFB\x05', 'binary'),
      Buffer.from('\x01\x00\xFB\x01', 'binary')
    )
    const flags = reader.uint(1)
    state.raw.flags = flags
    state.password = this.readFlag(flags, 0)
    state.raw.registeredOnly = this.readFlag(flags, 1)
    state.raw.fogOfWar = this.readFlag(flags, 2)
    state.raw.friendlyFire = this.readFlag(flags, 3)
    state.raw.botsEnabled = this.readFlag(flags, 5)
    state.raw.luaScripts = this.readFlag(flags, 6)
    state.raw.forceLight = this.readFlag(flags, 7)
    state.name = this.readString(reader)
    state.map = this.readString(reader)
    state.numplayers = reader.uint(1)
    state.maxplayers = reader.uint(1)
    if (flags & 32) {
      state.raw.gamemode = reader.uint(1)
    } else {
      state.raw.gamemode = 0
    }
    state.raw.numbots = reader.uint(1)
    const flags2 = reader.uint(1)
    state.raw.flags2 = flags2
    state.raw.recoil = this.readFlag(flags2, 0)
    state.raw.offScreenDamage = this.readFlag(flags2, 1)
    state.raw.hasDownloads = this.readFlag(flags2, 2)
    reader.skip(2)
    const players = reader.uint(1)
    for (let i = 0; i < players; i++) {
      const player = {}
      player.id = reader.uint(1)
      player.name = this.readString(reader)
      player.team = reader.uint(1)
      player.score = reader.uint(4)
      player.deaths = reader.uint(4)
      state.players.push(player)
    }
  }

  async sendQuery (request, expectedHeader) {
    // Send multiple copies of the request packet, because cs2d likes to just ignore them randomly
    await this.udpSend(request)
    await this.udpSend(request)
    return await this.udpSend(request, (buffer) => {
      const reader = this.reader(buffer)
      const header = reader.part(4)
      if (!header.equals(expectedHeader)) return
      return reader
    })
  }

  readFlag (flags, offset) {
    return !!(flags & (1 << offset))
  }

  readString (reader) {
    return reader.pascalString(1)
  }
}
