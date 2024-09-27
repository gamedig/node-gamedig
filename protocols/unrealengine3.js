import Core from './core.js'

export const PlatformType = {
  Unknown: 0,
  Windows: 1,
  Xenon: 4,
  PS3: 8,
  Linux: 16,
  MacOSX: 32
}

/** The types of advertisement of settings to use */
// eslint-disable-next-line no-unused-vars
export const EOnlineDataAdvertisementType = {
  /** Don't advertise via the online service or QoS data */
  ODAT_DontAdvertise: 0,
  /** Advertise via the online service only */
  ODAT_OnlineService: 1,
  /** Advertise via the QoS data only */
  ODAT_QoS: 2
}

/** The supported data types that can be stored in the union */
export const ESettingsDataType = {
  /** Means the data in the OnlineData value fields should be ignored */
  SDT_Empty: 0,
  /** 32 bit integer goes in Value1 only */
  SDT_Int32: 1,
  /** 64 bit integer stored in both value fields */
  SDT_Int64: 2,
  /** Double (8 byte) stored in both value fields */
  SDT_Double: 3,
  /** Unicode string pointer in Value2 with length in Value1 */
  SDT_String: 4,
  /** Float (4 byte) stored in Value1 fields */
  SDT_Float: 5,
  /** Binary data with count in Value1 and pointer in Value2 */
  SDT_Blob: 6,
  /** Date/time structure. Date in Value1 and time Value2 */
  SDT_DateTime: 7
}

/**
 * @typedef {Object|Uint8Array} UniqueNetId Struct that holds a transient, unique identifier for a player
 * @property {number[8]} Uid - The id used by the network to uniquely identify a player
 */

/**
 * @typedef {Object} OnlineGameSettings Holds the base configuration settings for an online game
 * @property {number} NumPublicConnections - The number of publicly available connections advertised
 * @property {number} NumPrivateConnections - The number of connections that are private (invite/password) only
 * @property {number} NumOpenPublicConnections - The number of publicly available connections that are available
 * @property {number} NumOpenPrivateConnections - The number of private connections that are available
 *
 * @property {boolean} bShouldAdvertise - Whether this match is publicly advertised on the online service
 * @property {boolean} bIsLanMatch - This game will be lan only and not be visible to external players
 * @property {boolean} bUsesStats - Whether the match should gather stats or not
 * @property {boolean} bAllowJoinInProgress - Whether joining in progress is allowed or not
 * @property {boolean} bAllowInvites - Whether the match allows invitations for this session or not
 * @property {boolean} bUsesPresence - Whether to display user presence information or not
 * @property {boolean} bAllowJoinViaPresence - Whether joining via player presence is allowed or not
 * @property {boolean} bUsesArbitration - Whether the session should use arbitration or not
 *
 * @property {string} OwningPlayerName - The owner of the game
 * @property {UniqueNetId} OwningPlayerId - The unique net id of the player that owns this game
*/

/**
 * Structure used to represent a string setting that has a restricted and
 * localized set of value strings. For instance:
 *
 * GameType (id) Values = (0) Death Match, (1) Team Death Match, etc.
 *
 * This allows strings to be transmitted using only 8 bytes and each string
 * is correct for the destination language irrespective of sender's language
 * @typedef {Object} LocalizedStringSetting
 * @property {int} Id - The unique identifier for this localized string
 * @property {int} ValueIndex - The unique identifier for this localized string
 * @property EOnlineDataAdvertisementType AdvertisementType - How this setting should be presented to requesting clients: online or QoS
 */

/**
 * Structure to hold arbitrary data of a given type.
 * @typedef {Object} SettingsData
 * @property ESettingsDataType Type - Enum (byte) indicating the type of data held in the value fields
 * @property {int} Value1 - This is a union of value types and should never be used in script
 * @property {int} Value2 - This is a union of value types and should never be used in script. NOTE: It's declared as a pointer for 64bit systems
 * @property {*} ValueRaw - A raw value of the setting
 */

/**
 * Structure used to hold non-localized string data. Properties can be arbitrary types.
 * @typedef {Object} SettingsProperty
 * @property {int} PropertyId - The unique id for this property
 * @property {SettingsData} Data - The data stored for the type
 * @property EOnlineDataAdvertisementType AdvertisementType - How this setting should be presented to requesting clients: online or QoS
 */

/**
 * Holds the base properties for the quried data
 * @type {OnlineGameSettings}
 */
export const EmptyPayloadData = Object.freeze({
  NumOpenPublicConnections: 0,
  NumOpenPrivateConnections: 0,
  NumPublicConnections: 0,
  NumPrivateConnections: 0,

  bShouldAdvertise: undefined,
  bIsLanMatch: undefined,
  bUsesStats: undefined,
  bAllowJoinInProgress: undefined,
  bAllowInvites: undefined,
  bUsesPresence: undefined,
  bAllowJoinViaPresence: undefined,
  bUsesArbitration: undefined,
  bAntiCheatProtected: undefined, // in newer packets

  OwningPlayerName: undefined,
  OwningPlayerId: undefined
})

/** The size of the header for validation */
export const LAN_BEACON_PACKET_HEADER_SIZE = 16

// Offsets for various fields
/* eslint-disable */
const LAN_BEACON_VER_OFFSET = 0
const LAN_BEACON_PLATFORM_OFFSET = 1
const LAN_BEACON_GAMEID_OFFSET = 2
const LAN_BEACON_PACKETTYPE1_OFFSET = 6
const LAN_BEACON_PACKETTYPE2_OFFSET = 7
const LAN_BEACON_NONCE_OFFSET = 8
/* eslint-enable */

/**
 * Implements the protocol for UnrealEngine3 based games (UE3)
 */
export default class unrealengine3 extends Core {
  /**
   * Translates raw properties into known properties
   * @param {Object} state Current state data including raw values/properties
   */
  static staticPopulateProperties (state) {
    const split = (a) => {
      let s = a.split('\x1c')
      s = s.filter((e) => { return e })
      return s
    }
    if ('custom_mutators' in state.raw) state.raw.custom_mutators = split(state.raw.custom_mutators)
    if ('stock_mutators' in state.raw) state.raw.stock_mutators = split(state.raw.stock_mutators)
    if ('map' in state.raw) state.map = state.raw.map

    if ('hostname' in state.raw) state.name = state.raw.hostname
    else if ('servername' in state.raw) state.name = state.raw.servername
    if ('mapname' in state.raw) state.map = state.raw.mapname
    if (state.raw.password === '1') state.password = true
    if ('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers)
    if ('hostport' in state.raw) state.gamePort = parseInt(state.raw.hostport)
    if ('gamever' in state.raw) state.version = state.raw.gamever

    if (state.raw.playerTeamInfo && '' in state.raw.playerTeamInfo) {
      for (const playerInfo of state.raw.playerTeamInfo['']) {
        const player = {}
        for (const from of Object.keys(playerInfo)) {
          let key = from
          let value = playerInfo[from]

          if (key === 'player') key = 'name'
          if (key === 'score' || key === 'ping' || key === 'team' || key === 'deaths' || key === 'pid') value = parseInt(value)
          player[key] = value
  }
        state.players.push(player)
      }
    }

    if ('numplayers' in state.raw) state.numplayers = parseInt(state.raw.numplayers)
    else state.numplayers = state.players.length
  }

  /**
   * Converts a UE3 unique id to a string
   * @param {UniqueNetId} reader the unique net idenitifer
   * @returns {string} a converted unique identifier
   */
  static UniqueNetIdToString (uniqueNetId) {
    const bytes = ([...uniqueNetId]).reverse()
    const value = bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]
    return String(value)
  }

  /**
   * Generates a random client
   * @param {number} length The length of the random Id
   * @returns a length-byte-sized unique client Id
   */
  static generateNonce (length) {
    const nonce = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      nonce[i] = Math.floor(Math.random() * 256)
    }
    return nonce
  }

  /**
   * Parses/reads a UE3 string at the current position of the reader
   * @param {*} reader the reader to read data from
   * @returns a string of unlimited size
   */
  static readString (reader) {
    const stringLen = reader.uint(4)
    const stringContent = reader.string(stringLen)
    return stringContent
  }

  /**
   * Parses/reads a UE3 string at the current position of the reader
   * @param {*} reader the reader to read data from
   * @returns {UniqueNetId} unique identifier
   */
  static readUniqueNetId (reader) {
    const Uids = reader.part(8)
    const netId = new Uint8Array(Uids)
    return netId
  }

  /**
   * Parses/reads a UE3 localized setting at the current position of the reader
   * @param {*} reader the reader to read data from
   * @returns {LocalizedStringSetting} localized setting
   */
  static readLocalizedStringSetting (reader) {
    const fId = reader.int(4)
    const fValueIndex = reader.int(4)
    const fAdvertisementType = reader.uint(1)
    return {
      Id: fId,
      ValueIndex: fValueIndex,
      AdvertisementType: fAdvertisementType
    }
  }

  /**
   * Parses/reads a UE3 non-localized property setting at the current position of the reader
   * @param {*} reader the reader to read data from
   * @returns {SettingsProperty} non-localized property setting
   */
  static readSettingsProperty (reader) {
    const fPropertyId = reader.uint(4)
    const fData = unrealengine3.readSettingsData(reader)
    const fAdvertisementType = reader.uint(1)
    // build object
    return {
      PropertyId: fPropertyId,
      Data: fData,
      AdvertisementType: fAdvertisementType
    }
  }

  /**
   * Parses/reads a UE3 non-localized settings data at the current position of the reader
   * @param {*} reader the reader to read data from
   * @returns {SettingsData} non-localized settings data
   */
  static readSettingsData (reader) {
    let val
    const data = {
      Type: ESettingsDataType.SDT_Empty,
      ValueRaw: 0,
      Value1: 0,
      Value2: 0,

      cleanup () {
        // Strings are copied so make sure to delete them
        if (this.Type === ESettingsDataType.SDT_String) {
          delete this.Value2
        } else if (this.Type === ESettingsDataType.SDT_Blob) {
          delete this.Value2
        }
        this.Type = ESettingsDataType.SDT_Empty
        this.Value1 = 0
        this.Value2 = null
        this.ValueRaw = this.Value1
      },

      setDataDouble (InData) {
        this.cleanup()

        // Convert DOUBLE to a 64-bit integer representation
        const buffer = new ArrayBuffer(8)
        const view = new DataView(buffer)
        view.setFloat64(0, InData, true)

        // Get high/low parts
        const FullData = view.getBigUint64(0, true)
        this.Value1 = Number((FullData >> 32n) & 0xFFFFFFFFn)
        this.Value2 = Number(FullData & 0xFFFFFFFFn)
      },

      setDataFloat (InData) {
        this.cleanup()

        // Convert FLOAT to a 32-bit integer representation
        const buffer = new ArrayBuffer(4)
        const view = new DataView(buffer)
        view.setFloat32(0, InData, true)

        // Get the 32-bit integer representation
        this.Value1 = view.getInt32(0, true)
      }
    }

    // Read the type
    const type = reader.uint(1)
    data.Type = type

    // Now read the held data
    switch (type) {
      case ESettingsDataType.SDT_Float:
        val = reader.float()
        data.setDataFloat(val)
        break
      case ESettingsDataType.SDT_Int32:
        val = reader.int(4)
        // Data.SetData(valInt)
        break
      case ESettingsDataType.SDT_Int64:
        val = reader.int(8)
        // todo Data.Set...
        break
      case ESettingsDataType.SDT_Double:
        val = reader.double()
        data.SetData(val)
        break
      case ESettingsDataType.SDT_Blob:
        // TODO: Add parsing blob data
        throw new Error('Reading blob data is currently not supported')
      case ESettingsDataType.SDT_String:
        val = unrealengine3.readString(reader)
        // Data.SetData(Val);
        break
    }
    data.ValueRaw = val
    return data
  }
}
