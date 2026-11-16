import Core from './core.js'

const gameTypes = ['Survival', 'Creative', 'Adventure']

/*
Bedrock Dedicated Server 26.50+ defaults to the NetherNet transport (server.properties `transport=nethernet`),
which no longer answers the RakNet unconnected ping. Such servers expose the HTTP(S) signaling endpoint
`GET /v1/join` on the server port instead, which returns the server info as JSON:
https://mojang.github.io/bedrock-protocol-docs/guides/nether-net-onboarding-guide/
RakNet is tried first, NetherNet is used as a fallback.
 */

export default class minecraftbedrock extends Core {
  constructor () {
    super()
    this.byteorder = 'be'
  }

  async run (state) {
    try {
      await this.queryRakNet(state)
      state.raw.transport = 'raknet'
    } catch (e) {
      this.logger.debug('RakNet query failed, trying NetherNet: ' + e.message)
      await this.queryNetherNet(state)
      state.raw.transport = 'nethernet'
    }
  }

  async queryRakNet (state) {
    const bufs = [
      Buffer.from([0x01]), // Message ID, ID_UNCONNECTED_PING
      Buffer.from('1122334455667788', 'hex'), // Nonce / timestamp
      Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'), // Magic
      Buffer.from('0000000000000000', 'hex') // Cliend GUID
    ]

    return await this.udpSend(Buffer.concat(bufs), buffer => {
      const reader = this.reader(buffer)

      const messageId = reader.uint(1)
      if (messageId !== 0x1c) {
        this.logger.debug('Skipping packet, invalid message id')
        return
      }

      const nonce = reader.part(8).toString('hex') // should match the nonce we sent
      this.logger.debug('Nonce: ' + nonce)
      if (nonce !== '1122334455667788') {
        this.logger.debug('Skipping packet, invalid nonce')
        return
      }

      // These 8 bytes are identical to the serverId string we receive in decimal below
      reader.skip(8)

      const magic = reader.part(16).toString('hex')
      this.logger.debug('Magic value: ' + magic)
      if (magic !== '00ffff00fefefefefdfdfdfd12345678') {
        this.logger.debug('Skipping packet, invalid magic')
        return
      }

      const statusLen = reader.uint(2)
      if (reader.remaining() !== statusLen) {
        throw new Error('Invalid status length: ' + reader.remaining() + ' vs ' + statusLen)
      }

      const statusStr = reader.rest().toString('utf8')
      this.logger.debug('Raw status str: ' + statusStr)

      const split = statusStr.split(';')
      if (split.length < 6) {
        throw new Error('Missing enough chunks in status str')
      }

      state.raw.edition = split.shift()
      state.name = split.shift()
      state.raw.protocolVersion = split.shift()
      state.raw.mcVersion = split.shift()
      state.version = state.raw.mcVersion
      state.numplayers = parseInt(split.shift())
      state.maxplayers = parseInt(split.shift())
      if (split.length) state.raw.serverId = split.shift()
      if (split.length) state.map = split.shift()
      if (split.length) state.raw.gameMode = split.shift()
      if (split.length) state.raw.nintendoOnly = !!parseInt(split.shift())
      if (split.length) state.raw.ipv4Port = split.shift()
      if (split.length) state.raw.ipv6Port = split.shift()

      return true
    })
  }

  async queryNetherNet (state) {
    const { address, port } = this.options
    const host = address.includes(':') ? `[${address}]` : address

    // The guide prefers HTTPS but servers may answer plain HTTP only, so both are tried.
    let body = null
    const errors = []
    for (const scheme of ['https', 'http']) {
      try {
        body = await this.request({
          url: `${scheme}://${host}:${port}/v1/join`,
          https: {
            // NetherNet signaling commonly uses self-signed certificates, set `rejectUnauthorized` to `true` to enforce verification.
            rejectUnauthorized: this.options.rejectUnauthorized === true
          }
        })
        break
      } catch (e) {
        this.logger.debug(`NetherNet ${scheme} request failed: ` + e.message)
        errors.push(`${scheme}: ${e.message.split('\n')[0]}`)
      }
    }

    if (body === null) {
      throw new Error('NetherNet /v1/join request failed (' + errors.join(', ') + ')')
    }

    if (!body.trim()) {
      throw new Error('NetherNet /v1/join returned an empty body (is enable-lan-visibility disabled?)')
    }

    let info
    try {
      info = JSON.parse(body)
    } catch (e) {
      throw new Error('NetherNet /v1/join returned invalid JSON')
    }

    if (typeof info !== 'object' || info === null || typeof info.players !== 'number' || typeof info.maxPlayers !== 'number') {
      throw new Error('NetherNet /v1/join returned an unexpected payload')
    }

    state.raw.nethernet = info
    // Some servers double-escape formatting codes, leaving literal `§` sequences in the name.
    state.name = String(info.name ?? '').replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    state.numplayers = info.players
    state.maxplayers = info.maxPlayers
    if (info.level) state.map = info.level
    if (info.version) {
      state.raw.mcVersion = info.version
      state.version = info.version
    }
    if (info.protocol !== undefined) state.raw.protocolVersion = String(info.protocol)
    if (info.gameType !== undefined) state.raw.gameMode = gameTypes[info.gameType] ?? String(info.gameType)
  }
}
