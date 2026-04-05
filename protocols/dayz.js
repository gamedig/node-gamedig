import valve from './valve.js'
import { Buffer } from 'node:buffer'

/** C0 control / non-printable garbage (misaligned binary parsed as title). */
function dayzTitleHasControlGarbage (s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) {
      return true
    }
  }
  return false
}

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

    state.raw.dayzMods = this.sanitizeDayzModsList(this.readDayzMods(Buffer.from(dayZPayload)))
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
      return []
    }

    this.logger.debug('DAYZ BUFFER')
    this.logger.debug(buffer)

    const reader = this.reader(buffer)
    // Single-byte header fields use DayZ byte encoding. Multi-byte integers use
    // readDayzUint (per-byte DayZ decoding) so 0x01 in the stream does not
    // misalign; strings use raw uint8 length + UTF-8 octets (see readDayzString)
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

  /**
   * Drop entries that are clearly mis-parsed (binary in title, empty names) or
   * non-objects. Steam Workshop titles are never empty for listed items; empty
   * titles usually mean padding or misalignment after the real mod list.
   */
  sanitizeDayzModsList (mods) {
    if (!Array.isArray(mods)) {
      return []
    }
    return mods.filter((mod) => {
      if (mod == null || typeof mod !== 'object') {
        return false
      }
      const rawTitle = mod.title
      if (typeof rawTitle !== 'string') {
        return false
      }
      const title = rawTitle.trim()
      if (!title) {
        return false
      }
      if (dayzTitleHasControlGarbage(rawTitle)) {
        return false
      }
      if ('workshopId' in mod) {
        const id = mod.workshopId
        if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
          return false
        }
      }
      return true
    }).map((mod) => {
      const title = typeof mod.title === 'string' ? mod.title.trim() : mod.title
      return { ...mod, title }
    })
  }

  readDayzModsSection (/** Reader */ reader, withHeader) {
    const out = []
    // Entry count is a raw byte; readDayzByte can mis-handle value 1 (0x01)
    const count = reader.uint(1)
    this.logger.debug('dayz mod section withHeader:' + withHeader + ' count:' + count)
    for (let i = 0; i < count; i++) {
      if (reader.done()) break
      const mod = {}
      if (withHeader) {
        mod.unknown = this.readDayzUint(reader, 4) // ?

        // Raw byte: 0x04 = standard mod entry. readDayzByte would mis-handle 0x01
        const offset = reader.offset()
        const flag = reader.uint(1)
        if (flag !== 4) reader.setOffset(offset)

        // When flag === 4, workshop uses DayZ 0x01 0x01 prefix encoding (readDayzUint)
        // When flag !== 4, the next 4 octets are raw LE only; readDayzUint would eat
        // into the following title (e.g. 01 01 01 02 before length 0x14 and "Umbrella")
        mod.workshopId = flag === 4
          ? this.readDayzUint32(reader)
          : reader.uint(4)
      }
      mod.title = this.readDayzString(reader)
      this.logger.debug(mod)
      out.push(mod)
    }
    return out
  }

  /**
   * Workshop id after flag 0x04: almost always DayZ readDayzUint (variable raw
   * byte count). Exception: raw uint32 LE when the stream begins with 0x01 0x02
   * (e.g. 1427374081 = 01 02 18 55) — readDayzUint would steal the title length.
   * Some servers send 01 02 … where the next field is still DayZ-encoded (e.g.
   * 01 02 08 27 6b 12 …); raw uint32 then leaves 0x6b as the title length and
   * merges many mods into one string. If the byte after a raw four-byte id is
   * too large to be a typical mod name length, use readDayzUint instead.
   */
  readDayzUint32 (reader) {
    const p = reader.offset()
    const b0 = reader.uint(1)
    const b1 = reader.uint(1)
    reader.setOffset(p)
    if (b0 === 0x01 && b1 === 0x02) {
      reader.skip(4)
      const lenAfterRaw = reader.uint(1)
      reader.setOffset(p)
      if (lenAfterRaw >= 0x60) {
        return this.readDayzUint(reader, 4)
      }
      return reader.uint(4)
    }
    return this.readDayzUint(reader, 4)
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
    const length = reader.uint(1)
    return reader.string(length)
  }
}
