import quake3 from './quake3.js'

export default class warsow extends quake3 {
  async run (state) {
    await super.run(state)
    if (state.players) {
      for (const player of state.players) {
        player.team = player.address
        delete player.address
      }
    }
  }
}
