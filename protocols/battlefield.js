import Core from './core.js'

export default class battlefield extends Core {
  constructor () {
    super()
    this.encoding = 'latin1'
  }

  async run (state) {
    await this.withTcp(async socket => {
      {
        const data = await this.query(socket, ['serverInfo'])
        state.name = data.shift()
        state.numplayers = parseInt(data.shift())
        state.maxplayers = parseInt(data.shift())
        state.raw.gametype = data.shift()
        state.map = data.shift()
        state.raw.roundsplayed = parseInt(data.shift())
        state.raw.roundstotal = parseInt(data.shift())

        const teamCount = data.shift()
        state.raw.teams = []
        for (let i = 0; i < teamCount; i++) {
          const tickets = parseFloat(data.shift())
          state.raw.teams.push({
            tickets
          })
        }

        state.raw.targetscore = parseInt(data.shift())
        state.raw.status = data.shift()

        // Seems like the fields end at random places beyond this point
        // depending on the server version

        if (data.length) state.raw.ranked = (data.shift() === 'true')
        if (data.length) state.raw.punkbuster = (data.shift() === 'true')
        if (data.length) state.password = (data.shift() === 'true')
        if (data.length) state.raw.uptime = parseInt(data.shift())
        if (data.length) state.raw.roundtime = parseInt(data.shift())

        const isBadCompany2 = data[0] === 'BC2'
        if (isBadCompany2) {
          if (data.length) data.shift()
          if (data.length) data.shift()
        }
        if (data.length) {
          state.raw.ip = data.shift()
          const split = state.raw.ip.split(':')
          state.gameHost = split[0]
          state.gamePort = split[1]
        } else {
          // best guess if the server doesn't tell us what the server port is
          // these are just the default game ports for different default query ports
          if (this.options.port === 48888) state.gamePort = 7673
          if (this.options.port === 22000) state.gamePort = 25200
        }
        if (data.length) state.raw.punkbusterversion = data.shift()
        if (data.length) state.raw.joinqueue = (data.shift() === 'true')
        if (data.length) state.raw.region = data.shift()
        if (data.length) state.raw.pingsite = data.shift()
        if (data.length) state.raw.country = data.shift()
        if (data.length) state.raw.quickmatch = (data.shift() === 'true')
      }

      {
        const data = await this.query(socket, ['version'])
        data.shift()
        state.version = data.shift()
      }

      {
        const data = await this.query(socket, ['listPlayers', 'all'])
        const fieldCount = parseInt(data.shift())
        const fields = []
        for (let i = 0; i < fieldCount; i++) {
          fields.push(data.shift())
        }
        const numplayers = data.shift()
        for (let i = 0; i < numplayers; i++) {
          const player = {}
          for (let key of fields) {
            let value = data.shift()

            if (key === 'teamId') key = 'team'
            else if (key === 'squadId') key = 'squad'

            if (['kills', 'deaths', 'score', 'rank', 'team', 'squad', 'ping', 'type'].includes(key)) {
              value = parseInt(value)
            }

            player[key] = value
          }
          state.players.push(player)
        }
      }
    })
  }

  async query (socket, params) {
    const outPacket = this.buildPacket(params)
    return await this.tcpSend(socket, outPacket, (data) => {
      const decoded = this.decodePacket(data)
      if (decoded) {
        this.logger.debug(decoded)
        if (decoded.shift() !== 'OK') throw new Error('Missing OK')
        return decoded
      }
    })
  }

  buildPacket (params) {
    const paramBuffers = []
    for (const param of params) {
      paramBuffers.push(Buffer.from(param, 'utf8'))
    }

    let totalLength = 12
    for (const paramBuffer of paramBuffers) {
      totalLength += paramBuffer.length + 1 + 4
    }

    const b = Buffer.alloc(totalLength)
    b.writeUInt32LE(0, 0)
    b.writeUInt32LE(totalLength, 4)
    b.writeUInt32LE(params.length, 8)
    let offset = 12
    for (const paramBuffer of paramBuffers) {
      b.writeUInt32LE(paramBuffer.length, offset); offset += 4
      paramBuffer.copy(b, offset); offset += paramBuffer.length
      b.writeUInt8(0, offset); offset += 1
    }

    return b
  }

  decodePacket (buffer) {
    if (buffer.length < 8) return false
    const reader = this.reader(buffer)
    const header = reader.uint(4)
    const totalLength = reader.uint(4)
    // Venice Unleashed servers "broadcast" in-game events to any connected rcon client
    // If we get such a non-response packet, skip it and decode any remaining data
    // Note: We will receive the broadcast ticket again next time the socket receives data, as data is concatenated
    if (!(header & 0x40000000)) {
      // Skip total length minus already read bytes (4 header + 4 length)
      reader.skip(totalLength - 8)
      if (reader.done()) {
        this.logger.debug('Skipping packet, type mismatch')
        return
      } else {
        return this.decodePacket(reader.rest())
      }
    }
    if (buffer.length < totalLength) return false
    this.logger.debug('Expected ' + totalLength + ' bytes, have ' + buffer.length)

    const paramCount = reader.uint(4)
    const params = []
    for (let i = 0; i < paramCount; i++) {
      params.push(reader.pascalString(4))
      reader.uint(1) // strNull
    }
    return params
  }
}
