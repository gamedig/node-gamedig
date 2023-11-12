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
    }
    for (const player of state.players) {
      player.name = this.stripColors(player.name)
    }
  }

  stripColors (str) {
    return str.replace(/\^(X.{6}|.)/g, '')
  }
}
