import brokeprotocolmaster from './brokeprotocolmaster.js'

/**
 * Implements the protocol for BROKE PROTOCOL, a Unity based game
 * using a custom master server
 */
export default class brokeprotocol extends brokeprotocolmaster {
  constructor () {
    super()
    this.doQuerySingle = true
    this.requireToken = true
  }
}
