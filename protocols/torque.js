import Core from './core.js'

const GameInfoRequest = 18
const GameInfoResponse = 20

export default class torque extends Core {
  constructor () {
    super()
    this.usedTcp = false
  }

  async run (state) {
    const session = Math.floor(Math.random() * 0x1000)
    const key = session & 0xFFFF
    const request = Buffer.alloc(6)
    request.writeUInt8(GameInfoRequest, 0)
    request.writeUInt8(0, 1)
    request.writeUInt32LE((session << 16) | key, 2)

    const response = await this.udpSend(request, b => b)
    const reader = this.reader(response)

    if (reader.uint(1) !== GameInfoResponse) {
      throw new Error('Not expected response first byte.')
    }

    reader.skip(5) // flags + key
    console.log(reader.string())
    console.log(reader.string())
    console.log(reader.string())

    console.log(response)
  }
}
