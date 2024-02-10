import valve from './valve.js'

export default class ffow extends valve {
  constructor () {
    super()
    this.byteorder = 'be'
    this.legacyChallenge = true
  }

  async queryInfo (state) {
    this.logger.debug('Requesting ffow info ...')
    const b = await this.sendPacket(
      0x46,
      'LSQ',
      0x49
    )

    const reader = this.reader(b)
    state.raw.protocol = reader.uint(1)
    state.name = reader.string()
    state.map = reader.string()
    state.raw.mod = reader.string()
    state.raw.gamemode = reader.string()
    state.raw.description = reader.string()
    state.version = reader.string()
    state.gamePort = reader.uint(2)
    state.numplayers = reader.uint(1)
    state.maxplayers = reader.uint(1)
    state.raw.listentype = String.fromCharCode(reader.uint(1))
    state.raw.environment = String.fromCharCode(reader.uint(1))
    state.password = !!reader.uint(1)
    state.raw.secure = reader.uint(1)
    state.raw.averagefps = reader.uint(1)
    state.raw.round = reader.uint(1)
    state.raw.maxrounds = reader.uint(1)
    state.raw.timeleft = reader.uint(2)
  }
}
