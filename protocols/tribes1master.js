import Core from './core.js'

/** Unsupported -- use at your own risk!! */

export default class tribes1master extends Core {
  constructor () {
    super()
    this.encoding = 'latin1'
  }

  async run (state) {
    const queryBuffer = Buffer.from([
      0x10, // standard header
      0x03, // dump servers
      0xff, // ask for all packets
      0x00, // junk
      0x01, 0x02 // challenge
    ])

    const parts = new Map()
    let total = 0
    const full = await this.udpSend(queryBuffer, (buffer) => {
      const reader = this.reader(buffer)
      const header = reader.uint(2)
      if (header !== 0x0610) {
        this.logger.debug('Header response does not match: ' + header.toString(16))
        return
      }
      const num = reader.uint(1)
      const t = reader.uint(1)
      if (t <= 0 || (total > 0 && t !== total)) {
        throw new Error('Conflicting packet total: ' + t)
      }
      total = t

      if (num < 1 || num > total) {
        this.logger.debug('Invalid packet number: ' + num + ' ' + total)
        return
      }
      if (parts.has(num)) {
        this.logger.debug('Duplicate part: ' + num)
        return
      }

      reader.skip(2) // challenge (0x0201)
      reader.skip(2) // always 0x6600
      parts.set(num, reader.rest())

      if (parts.size === total) {
        const ordered = []
        for (let i = 1; i <= total; i++) ordered.push(parts.get(i))
        return Buffer.concat(ordered)
      }
    })

    const fullReader = this.reader(full)
    state.raw.name = this.readString(fullReader)
    state.raw.motd = this.readString(fullReader)

    state.raw.servers = []
    while (!fullReader.done()) {
      fullReader.skip(1) // junk ?
      const count = fullReader.uint(1)
      for (let i = 0; i < count; i++) {
        const six = fullReader.uint(1)
        if (six !== 6) {
          throw new Error('Expecting 6')
        }
        const ip = fullReader.uint(4)
        const port = fullReader.uint(2)
        const ipStr = (ip & 255) + '.' + (ip >> 8 & 255) + '.' + (ip >> 16 & 255) + '.' + (ip >>> 24)
        state.raw.servers.push(ipStr + ':' + port)
      }
    }
  }

  readString (reader) {
    return reader.pascalString(1)
  }
}
