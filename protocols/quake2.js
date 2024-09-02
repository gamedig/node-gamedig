import Core from './core.js'

export default class quake2 extends Core {
  constructor () {
    super()
    this.encoding = 'latin1'
    this.delimiter = '\n'
    this.sendHeader = 'status'
    this.responseHeader = 'print'
    this.isQuake1 = false
  }

  async run (state) {
    const body = await this.udpSend('\xff\xff\xff\xff' + this.sendHeader + '\x00', packet => {
      const reader = this.reader(packet)
      const header = reader.string({ length: 4, encoding: 'latin1' })
      if (header !== '\xff\xff\xff\xff') return
      let type
      if (this.isQuake1) {
        type = reader.string(this.responseHeader.length)
      } else {
        type = reader.string({ encoding: 'latin1' })
      }
      if (type !== this.responseHeader) return
      return reader.rest()
    })

    const reader = this.reader(body)
    const info = reader.string().split('\\')
    if (info[0] === '') info.shift()

    while (true) {
      const key = info.shift()
      const value = info.shift()
      if (typeof value === 'undefined') break
      state.raw[key] = value
    }

    while (!reader.done()) {
      const line = reader.string()
      if (!line || line.charAt(0) === '\0') break

      const args = []
      const split = line.split('"')
      split.forEach((part, i) => {
        const inQuote = (i % 2 === 1)
        if (inQuote) {
          args.push(part)
        } else {
          const splitSpace = part.split(' ')
          for (const subpart of splitSpace) {
            if (subpart) args.push(subpart)
          }
        }
      })

      const player = {}
      if (this.isQuake1) {
        player.id = parseInt(args.shift())
        player.score = parseInt(args.shift())
        player.time = parseInt(args.shift())
        player.ping = parseInt(args.shift())
        player.name = args.shift()
        player.skin = args.shift()
        player.color1 = parseInt(args.shift())
        player.color2 = parseInt(args.shift())
      } else {
        player.frags = parseInt(args.shift())
        player.ping = parseInt(args.shift())
        player.name = args.shift() || ''
        if (!player.name) delete player.name
        player.address = args.shift() || ''
        if (!player.address) delete player.address
      }

      (player.ping ? state.players : state.bots).push(player)
    }

    if ('g_needpass' in state.raw) state.password = state.raw.g_needpass
    if ('mapname' in state.raw) state.map = state.raw.mapname
    if ('sv_maxclients' in state.raw) state.maxplayers = state.raw.sv_maxclients
    if ('maxclients' in state.raw) state.maxplayers = state.raw.maxclients
    if ('sv_hostname' in state.raw) state.name = state.raw.sv_hostname
    if ('hostname' in state.raw) state.name = state.raw.hostname
    if ('clients' in state.raw) state.numplayers = state.raw.clients
    if ('version' in state.raw) state.version = state.raw.version
    if ('iv' in state.raw) state.version = state.raw.iv
    else state.numplayers = state.players.length + state.bots.length
  }
}
