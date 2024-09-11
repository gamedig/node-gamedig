import { CoreLAN } from './core.js'
import unrealengine3, * as UE3 from './unrealengine3.js'

function parseNumber (str) {
  const number = +str
  return number
}

/**
 * Implements the LAN protocol for UnrealEngine3 based games (UE3)
 */
export default class unrealengine3lan extends CoreLAN {
  constructor () {
    super()
    this.sessionId = 1
    this.encoding = 'latin1'
    this.byteorder = 'be'
    this.useOnlySingleSplit = false
    this.isJc2mp = false

    this.translateMap = {}

    this.packetVersion = 1
    this.gameUniqueId = 0x00000000
    this.platform = UE3.PlatformType.Windows

    this.packetTypesQuery1 = 'S'
    this.packetTypesQuery2 = 'Q'
    this.packetTypesResponse1 = 'S'
    this.packetTypesResponse2 = 'R'

    // generate unique client id
    this.clientNonce = unrealengine3.generateNonce(8)
  }

  /** @override */
  getOptionsOverrides (outOptions) {
    super.getOptionsOverrides(outOptions)
    const defaults = {
      port: 14001
    }
    Object.assign(outOptions, defaults)
  }

  /** @override */
  updateOptionsDefaults () {
    super.updateOptionsDefaults()

    // update constructor values from options manually
    const { packetVersion, lanGameUniqueId, lanPacketPlatformMask } = this.options
    this.packetVersion = packetVersion ?? this.packetVersion
    this.gameUniqueId = lanGameUniqueId ? parseNumber(lanGameUniqueId) : this.gameUniqueId
    this.platform = lanPacketPlatformMask ?? this.platform
  }

  async run (state) {
    const { outputAsArray = false } = this.options

    // send single request and handle multi response
    const buffer = await this.sendPacket(this.packetVersion, this.gameUniqueId, false, false)
    const bufferList = Array.isArray(buffer) ? buffer : [buffer]
    const packets = bufferList.map((packet) => this.parsePacket(packet))

    // build response objects using Core logic's population
    const resultStates = packets.map(packet => {
      const packetState = { ...packet }
      this.populateState(packetState)
      return packetState
    })

    // either return as array, or linked list (defaults to linked list)
    if (outputAsArray && Array.isArray(state)) {
      state.push(...resultStates)
    } else {
      const firstPacket = resultStates.length ? { ...resultStates[0], $next: resultStates.slice(1).reduceRight((next, value) => ({ ...value, $next: next }), null) } : null
      Object.assign(state, firstPacket)
    }
  }

  /** @override */
  prepareRun () {
    // initially create an array as response as broadcast may result into multiple respones
    const { outputAsArray = false } = this.options
    return outputAsArray ? [] : {}
  }

  /** @override */
  finishRun (state) {
    // do nothing, state is already populated
  }

  /**
   * Sends initial query packet to receive a server response from any machine in the current subnet
   * @param {byte} type Packet version
   * @param {*} gameUniqueId Game Id typically unique for every game, some games share the same id (see LanGameUniqueId)
   * @returns list of valid responses
   */
  async sendPacket (type, gameUniqueId) {
    const b = Buffer.alloc(16)
    let offset = 0
    offset = b.writeUint8(type, offset)
    offset = b.writeUint8(this.platform, offset)
    offset = b.writeInt32BE(gameUniqueId, offset)
    offset += b.write(this.packetTypesQuery1, offset, 1, 'ascii')
    offset += b.write(this.packetTypesQuery2, offset, 1, 'ascii')
    Buffer.from(this.clientNonce.buffer).copy(b, offset); offset += this.clientNonce.length

    return await this.udpSend(b, (buffer) => {
      if (this.isValidLanResponsePacket(buffer)) {
        return buffer
      }
    })
  }

  /**
   * Parses the packet from given buffer
   * @param {Buffer} buffer the current buffer to parse the packet data from
   * @returns Parsed and translated server response object
   */
  parsePacket (buffer) {
    // create default empty state
    const state = this.createState()
    Object.assign(state, UE3.EmptyPayloadData)

    const fullReader = this.reader(buffer)
    const packetVersion = fullReader.uint(1)
    fullReader.skip(UE3.LAN_BEACON_PACKET_HEADER_SIZE - 1)
    const payload = fullReader.rest()

    const reader = this.reader(payload)

    // read session info
    const ip = reader.uint(4)
    const port = reader.uint(4)
    const ipStr = (ip >> 24 & 255) + '.' + (ip >> 16 & 255) + '.' + (ip >> 8 & 255) + '.' + (ip & 255)
    state.raw.hostaddress = ipStr
    state.raw.hostport = port

    state.raw.NumOpenPublicConnections = reader.uint(4)
    state.raw.NumOpenPrivateConnections = reader.uint(4)
    state.raw.NumPublicConnections = reader.uint(4)
    state.raw.NumPrivateConnections = reader.uint(4)

    // new packets seem to have an additional bool/byte field,
    // flags generally consist of 8 1-byte/bool values
    state.raw.bShouldAdvertise = reader.uint(1) === 1
    state.raw.bIsLanMatch = reader.uint(1) === 1
    state.raw.bUsesStats = reader.uint(1) === 1
    state.raw.bAllowJoinInProgress = reader.uint(1) === 1
    state.raw.bAllowInvites = reader.uint(1) === 1
    state.raw.bUsesPresence = reader.uint(1) === 1
    state.raw.bAllowJoinViaPresence = reader.uint(1) === 1
    state.raw.bUsesArbitration = reader.uint(1) === 1
    if (packetVersion >= 5) {
      // read additional flag for newer packets
      state.raw.bAntiCheatProtected = reader.uint(1) === 1
    }

    // Read the owning player id
    state.raw.OwningPlayerId = unrealengine3.readUniqueNetId(reader)
    // Read the owning player name
    state.raw.OwningPlayerName = unrealengine3.readString(reader)

    // properties from the advertised settings
    const localizedProperties = []
    state.raw.LocalizedProperties = localizedProperties
    const NumAdvertisedProperties = reader.uint(4)
    if (reader.remaining() > 0) { // check if overflown
      for (let index = 0; index < NumAdvertisedProperties && reader.remaining() > 0; index++) {
        // parse and add property to array
        const property = unrealengine3.readLocalizedStringSetting(reader)
        localizedProperties.push(property)
      }
    }

    // Now read the contexts and properties from the settings class
    const properties = []
    state.raw.Properties = properties
    const NumProperties = reader.uint(4)
    if (reader.remaining() > 0) { // check if overflown
      for (let index = 0; index < NumProperties && reader.remaining() > 0; index++) {
        // parse and add property to array
        const property = unrealengine3.readSettingsProperty(reader)
        properties.push(property)
      }
    }

    // if data could not be processed properly, meaning some specific properties cannot be read
    // the current position might exceed the buffer, remaining() will be negative for such case
    if (reader.remaining() < 0) {
      // clear array
      properties.length = 0
      localizedProperties.length = 0
    }

    // Turn all that raw state into something useful
    this.populateProperties(state)
    // DEBUG: delete state.raw

    return state
  }

  /**
   * Translates raw properties into known properties
   * @param {Object} state Parsed data
   */
  populateProperties (state) {
    // pass raw data
    state.gameHost = state.raw.hostaddress
    state.gamePort = state.raw.hostport

    state.name = state.raw.OwningPlayerName
    state.maxplayers = state.raw.NumOpenPublicConnections

    state.NumOpenPublicConnections = state.raw.NumOpenPublicConnections
    state.NumOpenPrivateConnections = state.raw.NumOpenPrivateConnections
    state.NumPublicConnections = state.raw.NumPublicConnections
    state.NumPrivateConnections = state.raw.NumPrivateConnections

    state.bShouldAdvertise = state.raw.bShouldAdvertise
    state.bIsLanMatch = state.raw.bIsLanMatch
    state.bUsesStats = state.raw.bUsesStats
    state.bAllowJoinInProgress = state.raw.bAllowJoinInProgress
    state.bAllowInvites = state.raw.bAllowInvites
    state.bUsesPresence = state.raw.bUsesPresence
    state.bAllowJoinViaPresence = state.raw.bAllowJoinViaPresence
    state.bUsesArbitration = state.raw.bUsesArbitration
    state.bAntiCheatProtected = state.raw.bAntiCheatProtected

    state.OwningPlayerId = Buffer.from(state.raw.OwningPlayerId).toString('hex')
    state.OwningPlayerName = state.raw.OwningPlayerName

    // manually transform serialized properties into known structure
    const props = state.raw.Properties?.reduce((acc, prop) => {
      acc[`p${prop.PropertyId}`] = prop.Data.ValueRaw
      return acc
    }, {})

    // manually transform serialized localized properties into known structure
    const propsLocalized = state.raw.LocalizedProperties?.reduce((acc, prop) => {
      acc[`s${prop.Id}`] = prop.ValueIndex // TOOD: find actual value
      return acc
    }, {})

    // translate properties
    state.raw = { ...state.raw, ...props, ...propsLocalized }
    this.translate(state.raw, this.translateMap)

    // Turn all that raw state into something useful
    unrealengine3.staticPopulateProperties(state)

    if (!this.debug) {
      delete state.raw.LocalizedProperties
      delete state.raw.Properties
    }
  }

  /**
   * Checks if the given packet is a valid response packet for the current client
   * @param {Buffer} buffer the current buffer to parse the packet data from
   * @returns true if the packet is valid and can be parsed
   */
  isValidLanResponsePacket (buffer) {
    let bIsValid = false
    const bufferLength = (buffer ? buffer.length : null) ?? 0

    // Serialize out the data if the packet is the right size
    if (bufferLength > UE3.LAN_BEACON_PACKET_HEADER_SIZE) {
      const reader = this.reader(buffer)

      // version mismatch?
      const iVersion = reader.uint(1)
      if (iVersion === this.packetVersion) {
        // same platform?
        const iPlatform = reader.uint(1)
        if (iPlatform === this.platform) {
          // is response from same game?
          const iGameId = reader.int(4)
          if (iGameId === this.gameUniqueId) {
            const cServerResponse1 = reader.string(1)
            const cServerResponse2 = reader.string(1)
            if (cServerResponse1 === this.packetTypesResponse1 && cServerResponse2 === this.packetTypesResponse2) {
              // is response from same client?
              const nonceRaw = reader.part(8)
              const nonceHex = nonceRaw.toString('hex')
              const clientNonceHex = Buffer.from(this.clientNonce).toString('hex')
              bIsValid = (nonceHex === clientNonceHex)
            }
          }
        }
      }
    }
    return bIsValid
  }
}
