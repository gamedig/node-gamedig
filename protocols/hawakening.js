import hawakeningmaster from './hawakeningmaster.js'

/**
 * Implements the protocol for Hawakening, a fan project of the UnrealEngine3 based game HAWKEN
 * using a Meteor backend for the master server
 */
export default class hawakening extends hawakeningmaster {
  constructor () {
    super()
    this.doQuerySingle = true
    this.requireToken = true
  }
}
