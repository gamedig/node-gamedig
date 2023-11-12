import Core from './core.js'
import minecraftbedrock from './minecraftbedrock.js'
import minecraftvanilla from './minecraftvanilla.js'
import Gamespy3 from './gamespy3.js'

/*
Vanilla servers respond to minecraftvanilla only
Some modded vanilla servers respond to minecraftvanilla and gamespy3, or gamespy3 only
Some bedrock servers respond to gamespy3 only
Some bedrock servers respond to minecraftbedrock only
Unsure if any bedrock servers respond to gamespy3 and minecraftbedrock
 */

export default class minecraft extends Core {
  constructor () {
    super()
    this.srvRecord = '_minecraft._tcp'
  }

  async run (state) {
    /** @type {Promise<Results>[]} */
    const promises = []

    const vanillaResolver = new minecraftvanilla()
    vanillaResolver.options = this.options
    vanillaResolver.udpSocket = this.udpSocket
    promises.push((async () => {
      try { return await vanillaResolver.runOnceSafe() } catch (e) {}
    })())

    const gamespyResolver = new Gamespy3()
    gamespyResolver.options = {
      ...this.options,
      encoding: 'utf8'
    }
    gamespyResolver.udpSocket = this.udpSocket
    promises.push((async () => {
      try { return await gamespyResolver.runOnceSafe() } catch (e) {}
    })())

    const bedrockResolver = new minecraftbedrock()
    bedrockResolver.options = this.options
    bedrockResolver.udpSocket = this.udpSocket
    promises.push((async () => {
      try { return await bedrockResolver.runOnceSafe() } catch (e) {}
    })())

    const [vanillaState, gamespyState, bedrockState] = await Promise.all(promises)

    state.raw.vanilla = vanillaState
    state.raw.gamespy = gamespyState
    state.raw.bedrock = bedrockState

    if (!vanillaState && !gamespyState && !bedrockState) {
      throw new Error('No protocols succeeded')
    }

    // Ordered from least worth to most worth (player names / etc)
    if (bedrockState) {
      if (bedrockState.players.length) state.players = bedrockState.players
    }
    if (vanillaState) {
      try {
        let name = ''
        const description = vanillaState.raw.description
        if (typeof description === 'string') {
          name = description
        }
        if (!name && typeof description === 'object' && description.text) {
          name = description.text
        }
        if (!name && typeof description === 'object' && description.extra) {
          name = description.extra.map(part => part.text).join('')
        }
        state.name = name
      } catch (e) {}
      if (vanillaState.numplayers) state.numplayers = vanillaState.numplayers
      if (vanillaState.maxplayers) state.maxplayers = vanillaState.maxplayers
      if (vanillaState.players.length) state.players = vanillaState.players
      if (vanillaState.ping) this.registerRtt(vanillaState.ping)
    }
    if (gamespyState) {
      if (gamespyState.name) state.name = gamespyState.name
      if (gamespyState.numplayers) state.numplayers = gamespyState.numplayers
      if (gamespyState.maxplayers) state.maxplayers = gamespyState.maxplayers
      if (gamespyState.players.length) state.players = gamespyState.players
      else if (gamespyState.numplayers) state.numplayers = gamespyState.numplayers
      if (gamespyState.ping) this.registerRtt(gamespyState.ping)
    }
    if (bedrockState) {
      if (bedrockState.name) state.name = bedrockState.name
      if (bedrockState.numplayers) state.numplayers = bedrockState.numplayers
      if (bedrockState.maxplayers) state.maxplayers = bedrockState.maxplayers
      if (bedrockState.map) state.map = bedrockState.map
      if (bedrockState.ping) this.registerRtt(bedrockState.ping)
    }
    // remove dupe spaces from name
    state.name = state.name.replace(/\s+/g, ' ')
    // remove color codes from name
    state.name = state.name.replace(/\u00A7./g, '')
  }
}
