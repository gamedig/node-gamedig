import quake1 from './quake1.js'

export default class hexen2 extends quake1 {
  constructor () {
    super()
    this.sendHeader = '\xFFstatus\x0a'
    this.responseHeader = '\xffn'
  }

  async run (state) {
    await super.run(state)
    state.gamePort = this.options.port - 50
  }
}
