import quake2 from './quake2.js'

export default class quake1 extends quake2 {
  constructor () {
    super()
    this.responseHeader = 'n'
    this.isQuake1 = true
  }

  async run (state) {
    await super.run(state)
    if ('*version' in state.raw) state.version = state.raw['*version']
  }
}
