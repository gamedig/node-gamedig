import quake3 from './quake3.js'

export default class xonotic extends quake3 {
  async run (state) {
    await super.run(state)

    // Sometimes, the server returns a player's name as a number (which seems to be the team?) and the name in
    // an extra field called "address", we are not sure of this behaviour nor if this is a good enough solution
    for (const player of state.players) {
      if (!isNaN(player.name) && player.raw.address) {
        player.raw.team = player.name
        player.name = player.raw.address
      }
    }
  }
}
