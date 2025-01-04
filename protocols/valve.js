import Bzip2 from 'seek-bzip'
import Core from './core.js'
import { Buffer } from 'node:buffer'

const AppId = {
  Squad: 393380,
  Bat1944: 489940,
  Ship: 2400,
  Rust: 252490,
  CSGO: 730,
  CS_Source: 240,
  EternalSilence: 17550,
  Insurgency_MIC: 17700,
  Source_SDK_Base_2006: 215
}

export default class valve extends Core {
  constructor () {
    super()

    // legacy goldsrc info response -- basically not used by ANYTHING now,
    // as most (all?) goldsrc servers respond with the source info reponse
    // delete in a few years if nothing ends up using it anymore
    this.goldsrcInfo = false

    // unfortunately, the split format from goldsrc is still around, but we
    // can detect that during the query
    this.goldsrcSplits = false

    // some mods require a challenge, but don't provide them in the new format
    // at all, use the old dedicated challenge query if needed
    this.legacyChallenge = false

    // 2006 engines don't pass packet switching size in split packet header
    // while all others do, this need is detected automatically
    this._skipSizeInSplitHeader = false

    this._challenge = ''
  }

  async run (state) {
    if (!this.options.port) this.options.port = 27015
    await this.queryInfo(state)
    await this.queryChallenge()
    await this.queryPlayers(state)
    await this.queryRules(state)
    await this.cleanup(state)
  }

  async queryInfo (/** Results */ state) {
    this.logger.debug('Requesting info ...')
    const b = await this.sendPacket(
      this.goldsrcInfo ? undefined : 0x54,
      this.goldsrcInfo ? 'details' : 'Source Engine Query\0',
      this.goldsrcInfo ? 0x6D : 0x49,
      false
    )

    const reader = this.reader(b)

    if (this.goldsrcInfo) state.raw.address = reader.string()
    else state.raw.protocol = reader.uint(1)

    state.name = reader.string()
    state.map = reader.string()
    state.raw.folder = reader.string()
    state.raw.game = reader.string()
    if (!this.goldsrcInfo) state.raw.appId = reader.uint(2)
    state.numplayers = reader.uint(1)
    state.maxplayers = reader.uint(1)

    if (this.goldsrcInfo) state.raw.protocol = reader.uint(1)
    else state.raw.numbots = reader.uint(1)

    state.raw.listentype = String.fromCharCode(reader.uint(1))
    state.raw.environment = String.fromCharCode(reader.uint(1))

    state.password = !!reader.uint(1)
    if (this.goldsrcInfo) {
      state.raw.ismod = reader.uint(1)
      if (state.raw.ismod) {
        state.raw.modlink = reader.string()
        state.raw.moddownload = reader.string()
        reader.skip(1)
        state.raw.modversion = reader.uint(4)
        state.raw.modsize = reader.uint(4)
        state.raw.modtype = reader.uint(1)
        state.raw.moddll = reader.uint(1)
      }
    } else {
      state.raw.secure = reader.uint(1)
      if (state.raw.appId === AppId.Ship) {
        state.raw.shipmode = reader.uint(1)
        state.raw.shipwitnesses = reader.uint(1)
        state.raw.shipduration = reader.uint(1)
      }
      state.version = reader.string()

      const extraFlag = reader.uint(1)
      if (extraFlag & 0x80) state.gamePort = reader.uint(2)
      if (extraFlag & 0x10) state.raw.steamid = reader.uint(8).toString()
      if (extraFlag & 0x40) {
        state.raw.sourcetvport = reader.uint(2)
        state.raw.sourcetvname = reader.string()
      }
      if (extraFlag & 0x20) state.raw.tags = reader.string().split(',')
      if (extraFlag & 0x01) {
        const gameId = reader.uint(8)
        const betterAppId = gameId.getLowBitsUnsigned() & 0xffffff
        if (betterAppId) {
          state.raw.appId = betterAppId
        }
      }
    }

    const appId = state.raw.appId

    // from https://developer.valvesoftware.com/wiki/Server_queries
    if (
      state.raw.protocol === 7 && (
        state.raw.appId === AppId.Source_SDK_Base_2006 ||
                state.raw.appId === AppId.EternalSilence ||
                state.raw.appId === AppId.Insurgency_MIC ||
                state.raw.appId === AppId.CS_Source
      )
    ) {
      this._skipSizeInSplitHeader = true
    }
    this.logger.debug('INFO: ', state.raw)
    if (state.raw.protocol === 48) {
      this.logger.debug('GOLDSRC DETECTED - USING MODIFIED SPLIT FORMAT')
      this.goldsrcSplits = true
    }

    if (appId === AppId.Rust) {
      if (state.raw.tags) {
        for (const tag of state.raw.tags) {
          if (tag.startsWith('mp')) {
            const value = parseInt(tag.replace('mp', ''))
            if (!isNaN(value)) {
              state.maxplayers = value
            }
          }
          if (tag.startsWith('cp')) {
            const value = parseInt(tag.replace('cp', ''))
            if (!isNaN(value)) {
              state.numplayers = value
            }
          }
        }
      }
    }
  }

  async queryChallenge () {
    if (this.legacyChallenge) {
      // sendPacket will catch the response packet and
      // save the challenge for us
      this.logger.debug('Requesting legacy challenge key ...')
      await this.sendPacket(
        0x57,
        null,
        0x41,
        false
      )
    }
  }

  async queryPlayers (/** Results */ state) {
    state.raw.players = []

    if (!this.options.requestPlayers) {
      return
    }

    this.logger.debug('Requesting player list ...')
    const b = await this.sendPacket(
      this.goldsrcInfo ? undefined : 0x55,
      this.goldsrcInfo ? 'players' : null,
      0x44,
      true
    )

    if (b === null && !this.options.requestPlayersRequired) {
      // Player query timed out
      // CSGO doesn't respond to player query if host_players_show is not 2
      // Conan Exiles never responds to player query
      // Just skip it, and we'll fill with dummy objects in cleanup()
      return
    }

    const reader = this.reader(b)
    const num = reader.uint(1)
    for (let i = 0; i < num; i++) {
      reader.skip(1)
      const name = reader.string()
      const score = reader.int(4)
      const time = reader.float()

      this.logger.debug('Found player: ' + name + ' ' + score + ' ' + time)

      // CSGO sometimes adds a bot named 'Max Players' if host_players_show is not 2
      if (state.raw.appId === AppId.CSGO && name === 'Max Players') continue

      state.raw.players.push({
        name, score, time
      })
    }
  }

  async queryRules (/** Results */ state) {
    const appId = state.raw.appId
    if (appId === AppId.Squad ||
            appId === AppId.Bat1944 ||
            this.options.requestRules) {
      // let's get 'em
    } else {
      return
    }

    const rules = {}
    state.raw.rules = rules
    state.raw.rulesBytes = Buffer.from([])

    this.logger.debug('Requesting rules ...')

    if (this.goldsrcInfo) {
      const b = await this.udpSend('\xff\xff\xff\xffrules', b => b, () => null)
      if (b === null && !this.options.requestRulesRequired) return // timed out - the server probably has rules disabled

      state.raw.rulesBytes = b
      const reader = this.reader(b)
      while (!reader.done()) {
        const key = reader.string()
        rules[key] = reader.string()
      }
    } else {
      const b = await this.sendPacket(0x56, null, 0x45, true)
      if (b === null && !this.options.requestRulesRequired) return // timed out - the server probably has rules disabled

      state.raw.rulesBytes = b
      const reader = this.reader(b)
      const num = reader.uint(2)
      for (let i = 0; i < num; i++) {
        const key = reader.string()
        rules[key] = reader.string()
      }
    }

    // Battalion 1944 puts its info into rules fields for some reason
    if (appId === AppId.Bat1944) {
      if ('bat_name_s' in rules) {
        state.name = rules.bat_name_s
        delete rules.bat_name_s
        if ('bat_player_count_s' in rules) {
          state.numplayers = parseInt(rules.bat_player_count_s)
          delete rules.bat_player_count_s
        }
        if ('bat_max_players_i' in rules) {
          state.maxplayers = parseInt(rules.bat_max_players_i)
          delete rules.bat_max_players_i
        }
        if ('bat_has_password_s' in rules) {
          state.password = rules.bat_has_password_s === 'Y'
          delete rules.bat_has_password_s
        }
        // apparently map is already right, and this var is often wrong
        delete rules.bat_map_s
      }
    }

    // Squad keeps its password in a separate field
    if (appId === AppId.Squad) {
      if (rules.Password_b === 'true') {
        state.password = true
      }
    }
  }

  async cleanup (/** Results */ state) {
    // Organize players / hidden players into player / bot arrays
    const botProbability = (p) => {
      if (p.time === -1) return Number.MAX_VALUE
      return p.time
    }

    const rawPlayers = [...state.raw.players]
    const sortedPlayers = rawPlayers.sort((a, b) => {
      return botProbability(a) - botProbability(b)
    })

    const numBots = state.raw.numbots || 0

    while (state.bots.length < numBots && sortedPlayers.length) {
      state.bots.push(sortedPlayers.pop())
    }
    while ((state.players.length < state.numplayers - numBots || sortedPlayers.length) && sortedPlayers.length) {
      state.players.push(sortedPlayers.pop())
    }
  }

  /**
     * Sends a request packet and returns only the response type expected
     * @param {number} type
     * @param {boolean} sendChallenge
     * @param {?string|Buffer} payload
     * @param {number} expect
     * @param {boolean=} allowTimeout
     * @returns Buffer|null
     **/
  async sendPacket (
    type,
    payload,
    expect,
    allowTimeout
  ) {
    for (let keyRetry = 0; keyRetry < 3; keyRetry++) {
      let receivedNewChallengeKey = false
      const response = await this.sendPacketRaw(
        type, payload,
        (payload) => {
          const reader = this.reader(payload)
          const type = reader.uint(1)
          this.logger.debug(() => 'Received 0x' + type.toString(16) + ' expected 0x' + expect.toString(16))
          if (type === 0x41) {
            const key = reader.uint(4)
            if (this._challenge !== key) {
              this.logger.debug('Received new challenge key: 0x' + key.toString(16))
              this._challenge = key
              receivedNewChallengeKey = true
            }
          }
          if (type === expect) {
            return reader.rest()
          } else if (receivedNewChallengeKey) {
            return null
          }
        },
        () => {
          if (allowTimeout) return null
        }
      )
      if (!receivedNewChallengeKey) {
        return response
      }
    }
    throw new Error('Received too many challenge key responses')
  }

  /**
     * Sends a request packet and assembles partial responses
     * @param {number} type
     * @param {boolean} sendChallenge
     * @param {?string|Buffer} payload
     * @param {function(Buffer)} onResponse
     * @param {function()} onTimeout
     **/
  async sendPacketRaw (
    type,
    payload,
    onResponse,
    onTimeout
  ) {
    const challengeAtBeginning = type === 0x55 || type === 0x56
    const challengeAtEnd = type === 0x54 && !!this._challenge

    if (typeof payload === 'string') payload = Buffer.from(payload, 'binary')

    const b = Buffer.alloc(4 +
            (type !== undefined ? 1 : 0) +
            (challengeAtBeginning ? 4 : 0) +
            (challengeAtEnd ? 4 : 0) +
            (payload ? payload.length : 0)
    )
    let offset = 0

    let challenge = this._challenge
    if (!challenge) challenge = 0xffffffff

    b.writeInt32LE(-1, offset)
    offset += 4

    if (type !== undefined) {
      b.writeUInt8(type, offset)
      offset += 1
    }

    if (challengeAtBeginning) {
      if (this.byteorder === 'le') b.writeUInt32LE(challenge, offset)
      else b.writeUInt32BE(challenge, offset)
      offset += 4
    }

    if (payload) {
      payload.copy(b, offset)
      offset += payload.length
    }

    if (challengeAtEnd) {
      if (this.byteorder === 'le') b.writeUInt32LE(challenge, offset)
      else b.writeUInt32BE(challenge, offset)
      offset += 4
    }

    const packetStorage = {}
    return await this.udpSend(
      b,
      (buffer) => {
        const reader = this.reader(buffer)
        const header = reader.int(4)
        if (header === -1) {
          // full package
          this.logger.debug('Received full packet')
          return onResponse(reader.rest())
        }
        if (header === -2) {
          // partial package
          const uid = reader.uint(4)
          if (!(uid in packetStorage)) packetStorage[uid] = {}
          const packets = packetStorage[uid]

          let bzip = false
          if (!this.goldsrcSplits && uid & 0x80000000) bzip = true

          let packetNum, payload, numPackets
          if (this.goldsrcSplits) {
            packetNum = reader.uint(1)
            numPackets = packetNum & 0x0f
            packetNum = (packetNum & 0xf0) >> 4
            payload = reader.rest()
          } else {
            numPackets = reader.uint(1)
            packetNum = reader.uint(1)
            if (!this._skipSizeInSplitHeader) reader.skip(2)
            if (packetNum === 0 && bzip) reader.skip(8)
            payload = reader.rest()
          }

          packets[packetNum] = payload

          this.logger.debug(() => 'Received partial packet uid: 0x' + uid.toString(16) + ' num: ' + packetNum)
          this.logger.debug(() => 'Received ' + Object.keys(packets).length + '/' + numPackets + ' packets for this UID')

          if (Object.keys(packets).length !== numPackets) return

          // assemble the parts
          const list = []
          for (let i = 0; i < numPackets; i++) {
            if (!(i in packets)) {
              throw new Error('Missing packet #' + i)
            }
            list.push(packets[i])
          }

          let assembled = Buffer.concat(list)
          if (bzip) {
            this.logger.debug('BZIP DETECTED - Extracing packet...')
            try {
              assembled = Bzip2.decode(assembled)
            } catch (e) {
              throw new Error('Invalid bzip packet')
            }
          }
          const assembledReader = this.reader(assembled)
          assembledReader.skip(4) // header
          return onResponse(assembledReader.rest())
        }
      },
      onTimeout
    )
  }
}
