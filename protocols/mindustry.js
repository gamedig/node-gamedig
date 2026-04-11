import Core from './core.js'

const GAMEMODES = ['survival', 'sandbox', 'attack', 'pvp', 'editor']

export default class mindustry extends Core {
  constructor () {
    super()
    this.encoding = 'utf8'
    this.byteorder = 'be'
  }

  async run (state) {
    if (!this.options.port) this.options.port = 6567

    // arc-net discovery request: triggers the Mindustry server to reply
    // with a serialized Host struct (see Mindustry NetworkIO.writeServerData).
    const request = Buffer.from([0xfe, 0x01])
    const buffer = await this.udpSend(request, b => b)

    const reader = this.reader(buffer)
    const name = reader.pascalString(1)
    const map = reader.pascalString(1)
    const players = reader.int(4)
    const wave = reader.int(4)
    const version = reader.int(4)
    const vertype = reader.pascalString(1)
    const gamemodeId = reader.uint(1)
    const playerLimit = reader.int(4)
    const description = reader.pascalString(1)
    const modeName = reader.pascalString(1)

    state.name = name
    state.map = map
    state.password = false
    state.numplayers = players
    state.maxplayers = playerLimit
    state.version = String(version)
    state.raw.wave = wave
    state.raw.vertype = vertype
    state.raw.gamemode = GAMEMODES[gamemodeId] ?? String(gamemodeId)
    state.raw.description = description
    state.raw.modeName = modeName
  }
}
