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
    promises.push(vanillaResolver)

    const gamespyResolver = new Gamespy3()
    gamespyResolver.options = {
      ...this.options,
      encoding: 'utf8'
    }
    gamespyResolver.udpSocket = this.udpSocket
    promises.push(gamespyResolver)

    const bedrockResolver = new minecraftbedrock()
    bedrockResolver.options = this.options
    bedrockResolver.udpSocket = this.udpSocket
    promises.push(bedrockResolver)

    const ranPromises = promises.map(p => p.runOnceSafe().catch(_ => undefined))
    const [vanillaState, gamespyState, bedrockState] = await Promise.all(ranPromises)

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
        } else if (typeof description === 'object') {
          const stack = [description]

          while (stack.length) {
            const current = stack.pop()

            if (current.text) {
              name += current.text
            }

            if (Array.isArray(current.extra)) {
              stack.push(...current.extra.reverse())
            }
          }
        }
        state.name = name
      } catch (e) {}
      if (vanillaState.numplayers) state.numplayers = vanillaState.numplayers
      if (vanillaState.maxplayers) state.maxplayers = vanillaState.maxplayers
      if (vanillaState.players.length) state.players = vanillaState.players
      if (vanillaState.ping) this.registerRtt(vanillaState.ping)
      if (vanillaState.raw.version) state.version = vanillaState.raw.version.name
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
      if (bedrockState.raw.mcVersion) state.version = bedrockState.raw.mcVersion
    }
    // remove dupe spaces from name
    state.name = state.name.replace(/\s+/g, ' ')
    // remove color codes from name
    state.name = state.name.replace(/\u00A7./g, '')
  }
}
