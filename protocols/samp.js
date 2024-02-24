import Core from './core.js'

export default class samp extends Core {
  constructor () {
    super()
    this.encoding = 'win1252'
    this.magicHeader = 'SAMP'
    this.responseMagicHeader = null
    this.isVcmp = false
    this.isOmp = false
  }

  async run (state) {
    // read info
    {
      const reader = await this.sendPacket('i')
      if (this.isVcmp) {
        const consumed = reader.part(12)
        state.version = this.reader(consumed).string()
      }
      state.password = !!reader.uint(1)
      state.numplayers = reader.uint(2)
      state.maxplayers = reader.uint(2)
      state.name = reader.pascalString(4)
      state.raw.gamemode = reader.pascalString(4)
      state.raw.map = reader.pascalString(4)
    }

    // read rules
    if (!this.isVcmp) {
      const reader = await this.sendPacket('r')
      const ruleCount = reader.uint(2)
      state.raw.rules = {}
      for (let i = 0; i < ruleCount; i++) {
        const key = reader.pascalString(1)
        const value = reader.pascalString(1)
        state.raw.rules[key] = value
        if ('version' in state.raw.rules) state.version = state.raw.rules.version
      }
    }

    // read players
    // don't even bother if > 100 players, because the server won't respond
    if (state.numplayers < 100) {
      if (this.isVcmp || this.isOmp) {
        const reader = await this.sendPacket('c', true)
        if (reader !== null) {
          const playerCount = reader.uint(2)
          for (let i = 0; i < playerCount; i++) {
            const player = {}
            player.name = reader.pascalString(1)
            player.score = reader.int(4)
            state.players.push(player)
          }
        }
      } else {
        const reader = await this.sendPacket('d', true)
        if (reader !== null) {
          const playerCount = reader.uint(2)
          for (let i = 0; i < playerCount; i++) {
            const player = {}
            player.id = reader.uint(1)
            player.name = reader.pascalString(1)
            player.score = reader.int(4)
            player.ping = reader.uint(4)
            state.players.push(player)
          }
        }
      }
    }
  }

  async sendPacket (type, allowTimeout) {
    const outBuffer = Buffer.alloc(11)
    outBuffer.write(this.magicHeader, 0, 4)
    const ipSplit = this.options.address.split('.')
    outBuffer.writeUInt8(parseInt(ipSplit[0]), 4)
    outBuffer.writeUInt8(parseInt(ipSplit[1]), 5)
    outBuffer.writeUInt8(parseInt(ipSplit[2]), 6)
    outBuffer.writeUInt8(parseInt(ipSplit[3]), 7)
    outBuffer.writeUInt16LE(this.options.port, 8)
    outBuffer.writeUInt8(type.charCodeAt(0), 10)

    const checkBuffer = Buffer.from(outBuffer)
    if (this.responseMagicHeader) {
      checkBuffer.write(this.responseMagicHeader, 0, 4)
    }

    return await this.udpSend(
      outBuffer,
      (buffer) => {
        const reader = this.reader(buffer)
        for (let i = 0; i < checkBuffer.length; i++) {
          if (checkBuffer.readUInt8(i) !== reader.uint(1)) return
        }
        return reader
      },
      () => {
        if (allowTimeout) {
          return null
        }
      }
    )
  }
}
