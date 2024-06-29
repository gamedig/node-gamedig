import valve from './valve.js'
import { Buffer } from 'node:buffer'

export default class dayz extends valve {
  async run (state) {
    if (!this.options.port) this.options.port = 27016
    await super.queryInfo(state)
    await super.queryChallenge()
    await super.queryPlayers(state)
    await this.queryRules(state)

    this.processQueryInfo(state)
    await super.cleanup(state)
  }

  async queryRules (state) {
    if (!this.options.requestRules) {
      return
    }

    const rules = {}
    state.raw.rules = rules
    const dayZPayload = []

    this.logger.debug('Requesting rules ...')

    const b = await this.sendPacket(0x56, null, 0x45, true)
    if (b === null && !this.options.requestRulesRequired) return // timed out - the server probably has rules disabled

    let dayZPayloadEnded = false

    const reader = this.reader(b)
    const num = reader.uint(2)
    for (let i = 0; i < num; i++) {
      if (!dayZPayloadEnded) {
        const one = reader.uint(1)
        const two = reader.uint(1)
        const three = reader.uint(1)
        if (one !== 0 && two !== 0 && three === 0) {
          while (true) {
            const byte = reader.uint(1)
            if (byte === 0) break
            dayZPayload.push(byte)
          }
          continue
        } else {
          reader.skip(-3)
          dayZPayloadEnded = true
        }
      }

      const key = reader.string()
      rules[key] = reader.string()
    }

    state.raw.dayzMods = this.readDayzMods(Buffer.from(dayZPayload))
  }

  processQueryInfo (state) {
    // DayZ embeds some of the server information inside the tags attribute
    if (!state.raw.tags) { return }

    state.raw.dlcEnabled = false
    state.raw.firstPerson = false
    state.raw.privateHive = false
    state.raw.external = false
    state.raw.official = false

    for (const tag of state.raw.tags) {
      if (tag.startsWith('lqs')) {
        const value = parseInt(tag.replace('lqs', ''))
        if (!isNaN(value)) {
          state.raw.queue = value
        }
      }
      if (tag.includes('no3rd')) {
        state.raw.firstPerson = true
      }
      if (tag.includes('isDLC')) {
        state.raw.dlcEnabled = true
      }
      if (tag.includes('privHive')) {
        state.raw.privateHive = true
      }
      if (tag.includes('external')) {
        state.raw.external = true
      }
      if (tag.includes(':')) {
        state.raw.time = tag
      }
      if (tag.startsWith('etm')) {
        const value = parseInt(tag.replace('etm', ''))
        if (!isNaN(value)) {
          state.raw.dayAcceleration = value
        }
      }
      if (tag.startsWith('entm')) {
        const value = parseInt(tag.replace('entm', ''))
        if (!isNaN(value)) {
          state.raw.nightAcceleration = value
        }
      }
    }

    if (!state.raw.external && !state.raw.privateHive) {
      state.raw.official = true
    }
  }

  readDayzMods (/** Buffer */ buffer) {
    if (!buffer.length) {
      return {}
    }

    this.logger.debug('DAYZ BUFFER')
    this.logger.debug(buffer)

    const reader = this.reader(buffer)
    const version = this.readDayzByte(reader)
    const overflow = this.readDayzByte(reader)
    const dlc1 = this.readDayzByte(reader)
    const dlc2 = this.readDayzByte(reader)
    this.logger.debug('version ' + version)
    this.logger.debug('overflow ' + overflow)
    this.logger.debug('dlc1 ' + dlc1)
    this.logger.debug('dlc2 ' + dlc2)
    if (dlc1) {
      const unknown = this.readDayzUint(reader, 4) // ?
      this.logger.debug('unknown ' + unknown)
    }
    if (dlc2) {
      const unknown = this.readDayzUint(reader, 4) // ?
      this.logger.debug('unknown ' + unknown)
    }
    const mods = []
    mods.push(...this.readDayzModsSection(reader, true))
    mods.push(...this.readDayzModsSection(reader, false))
    this.logger.debug('dayz buffer rest:', reader.rest())
    return mods
  }

  readDayzModsSection (/** Reader */ reader, withHeader) {
    const out = []
    const count = this.readDayzByte(reader)
    this.logger.debug('dayz mod section withHeader:' + withHeader + ' count:' + count)
    for (let i = 0; i < count; i++) {
      if (reader.done()) break
      const mod = {}
      if (withHeader) {
        mod.unknown = this.readDayzUint(reader, 4) // ?

        // For some reason this is 4 on all of them, but doesn't exist on the last one? but only sometimes?
        const offset = reader.offset()
        const flag = this.readDayzByte(reader)
        if (flag !== 4) reader.setOffset(offset)

        mod.workshopId = this.readDayzUint(reader, 4)
      }
      mod.title = this.readDayzString(reader)
      this.logger.debug(mod)
      out.push(mod)
    }
    return out
  }

  readDayzUint (reader, bytes) {
    const out = []
    for (let i = 0; i < bytes; i++) {
      out.push(this.readDayzByte(reader))
    }
    const buf = Buffer.from(out)
    const r2 = this.reader(buf)
    return r2.uint(bytes)
  }

  readDayzByte (reader) {
    const byte = reader.uint(1)
    if (byte === 1) {
      const byte2 = reader.uint(1)
      if (byte2 === 1) return 1
      if (byte2 === 2) return 0
      if (byte2 === 3) return 0xff
      return 0 // ?
    }
    return byte
  }

  readDayzString (reader) {
    const length = this.readDayzByte(reader)
    const out = []
    for (let i = 0; i < length; i++) {
      out.push(this.readDayzByte(reader))
    }
    return Buffer.from(out).toString('utf8')
  }
}
