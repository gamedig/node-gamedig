import Core from './core.js'

export default class unreal2 extends Core {
  constructor () {
    super()
    this.encoding = 'latin1'
  }

  async run (state) {
    let extraInfoReader
    {
      const b = await this.sendPacket(0, true)
      const reader = this.reader(b)
      state.raw.serverid = reader.uint(4)
      state.raw.ip = this.readUnrealString(reader)
      state.gamePort = reader.uint(4)
      state.raw.queryport = reader.uint(4)
      state.name = this.readUnrealString(reader, true)
      state.map = this.readUnrealString(reader, true)
      state.raw.gametype = this.readUnrealString(reader, true)
      state.numplayers = reader.uint(4)
      state.maxplayers = reader.uint(4)
      this.logger.debug(log => {
        log('UNREAL2 EXTRA INFO', reader.buffer.slice(reader.i))
      })
      extraInfoReader = reader
    }

    {
      const b = await this.sendPacket(1, true)
      const reader = this.reader(b)
      state.raw.mutators = []
      state.raw.rules = {}
      while (!reader.done()) {
        const key = this.readUnrealString(reader, true)
        const value = this.readUnrealString(reader, true)
        this.logger.debug(key + '=' + value)
        if (key === 'Mutator' || key === 'mutator') {
          state.raw.mutators.push(value)
        } else if (key || value) {
          if (Object.prototype.hasOwnProperty.call(state.raw.rules, key)) {
            state.raw.rules[key] += ',' + value
          } else {
            state.raw.rules[key] = value
          }
        }
      }
      if ('GamePassword' in state.raw.rules) { state.password = state.raw.rules.GamePassword !== 'True' }
      if ('UTComp_Version' in state.raw.rules) { state.version = state.raw.rules.UTComp_Version }
    }

    if (state.raw.mutators.includes('KillingFloorMut') ||
            state.raw.rules['Num trader weapons'] ||
            state.raw.rules['Server Version'] === '1065'
    ) {
      // Killing Floor
      state.raw.wavecurrent = extraInfoReader.uint(4)
      state.raw.wavetotal = extraInfoReader.uint(4)
      state.raw.ping = extraInfoReader.uint(4)
      state.raw.flags = extraInfoReader.uint(4)
      state.raw.skillLevel = this.readUnrealString(extraInfoReader, true)
    } else {
      state.raw.ping = extraInfoReader.uint(4)
      // These fields were added in later revisions of unreal engine
      if (extraInfoReader.remaining() >= 8) {
        state.raw.flags = extraInfoReader.uint(4)
        state.raw.skill = this.readUnrealString(extraInfoReader, true)
      }
    }

    {
      const b = await this.sendPacket(2, false)
      const reader = this.reader(b)

      state.raw.scoreboard = {}
      while (!reader.done()) {
        const player = {}
        player.id = reader.uint(4)
        player.name = this.readUnrealString(reader, true)
        player.ping = reader.uint(4)
        player.score = reader.int(4)
        player.statsId = reader.uint(4)
        this.logger.debug(player)

        if (!player.id) {
          state.raw.scoreboard[player.name] = player.score
        } else if (!player.ping) {
          state.bots.push(player)
        } else {
          state.players.push(player)
        }
      }
    }
  }

  readUnrealString (reader, stripColor) {
    let length = reader.uint(1); let ucs2 = false
    if (length >= 0x80) {
      // This is flagged as a UCS-2 String
      length = (length & 0x7f) * 2
      ucs2 = true

      // For UCS-2 strings, some unreal 2 games randomly insert an extra 0x01 here,
      // not included in the length. Skip it if present (hopefully this never happens legitimately)
      const peek = reader.uint(1)
      if (peek !== 1) reader.skip(-1)

      this.logger.debug(log => {
        log('UCS2 STRING')
        log('UCS2 Length: ' + length)
        log(reader.buffer.slice(reader.i, reader.i + length))
      })
    }

    let out = ''
    if (ucs2) {
      out = reader.string({ encoding: 'ucs2', length })
      this.logger.debug('UCS2 String decoded: ' + out)
    } else if (length > 0) {
      out = reader.string()
    }

    // Sometimes the string has a null at the end (included with the length)
    // Strip it if present
    if (out.charCodeAt(out.length - 1) === 0) {
      out = out.substring(0, out.length - 1)
    }

    if (stripColor && this.options.stripColors) {
      out = out.replace(/\x1b...|[\x00-\x1a]/gus, '')
    }

    return out
  }

  async sendPacket (type, required) {
    const outbuffer = Buffer.from([0x79, 0, 0, 0, type])

    const packets = []
    return await this.udpSend(outbuffer, (buffer) => {
      const reader = this.reader(buffer)
      reader.uint(4) // header
      const iType = reader.uint(1)
      if (iType !== type) return
      packets.push(reader.rest())
    }, () => {
      if (!packets.length && required) return
      return Buffer.concat(packets)
    })
  }
}
