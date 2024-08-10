import Core from './core.js'
import Varint from 'varint'

export default class minecraftvanilla extends Core {
  async run (state) {
    const portBuf = Buffer.alloc(2)
    portBuf.writeUInt16BE(this.options.port, 0)

    const addressBuf = Buffer.from(this.options.host, 'utf8')

    const bufs = [
      this.varIntBuffer(47),
      this.varIntBuffer(addressBuf.length),
      addressBuf,
      portBuf,
      this.varIntBuffer(1)
    ]

    const outBuffer = Buffer.concat([
      this.buildPacket(0, Buffer.concat(bufs)),
      this.buildPacket(0)
    ])

    const data = await this.withTcp(async socket => {
      return await this.tcpSend(socket, outBuffer, data => {
        if (data.length < 10) return
        const reader = this.reader(data)
        const length = reader.varint()
        if (data.length < length) return
        return reader.rest()
      })
    })

    const reader = this.reader(data)

    const packetId = reader.varint()
    this.logger.debug('Packet ID: ' + packetId)

    const strLen = reader.varint()
    this.logger.debug('String Length: ' + strLen)

    const rest = reader.rest()

    const str = rest.toString('utf8', 0, strLen)
    this.logger.debug(str)

    const json = JSON.parse(str.substring(0, strLen))

    state.raw = json
    state.maxplayers = json.players.max
    state.numplayers = json.players.online

    if (json.players.sample) {
      for (const player of json.players.sample) {
        state.players.push({
          id: player.id,
          name: player.name
        })
      }
    }

    // Better Compatibility Checker mod support
    let bccJson = {}

    if (rest.length > strLen) {
      const bccStr = rest.toString('utf8', strLen + 1)
      bccJson = JSON.parse(bccStr)
    }

    state.raw.bcc = bccJson
  }

  varIntBuffer (num) {
    return Buffer.from(Varint.encode(num))
  }

  buildPacket (id, data) {
    if (!data) data = Buffer.from([])
    const idBuffer = this.varIntBuffer(id)
    return Buffer.concat([
      this.varIntBuffer(data.length + idBuffer.length),
      idBuffer,
      data
    ])
  }
}
