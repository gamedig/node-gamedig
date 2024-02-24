import quake2 from './quake2.js'

export default class quake3 extends quake2 {
  constructor () {
    super()
    this.sendHeader = 'getstatus'
    this.responseHeader = 'statusResponse'
  }

  async run (state) {
    await super.run(state)
    state.name = this.stripColors(state.name)
    for (const key of Object.keys(state.raw)) {
      state.raw[key] = this.stripColors(state.raw[key])
      if ('version' in state.raw) state.version = state.raw.version
    }
    for (const player of state.players) {
      player.name = this.stripColors(player.name)
    }
    for (const bot of state.bots) {
      bot.name = this.stripColors(bot.name)
    }
  }

  stripColors (str) {
    return this.options.stripColors ? str.replace(/\^(X.{6}|.)/g, '') : str
  }
}
