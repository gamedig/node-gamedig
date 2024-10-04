import renegadex from './renegadex.js'

/**
 * Implements the protocol for retrieving a master list for Renegade X, an UnrealEngine3 based game
 */
export default class renegadexmaster extends renegadex {
  async run (state) {
    const servers = await this.getMasterServerList()

    // pass processed servers as raw list
    state.raw.servers = servers.map((serverInfo) => {
      // TODO: may use any other deep-copy method like structuredClone() (in Node.js 17+)
      //       or use a method of Core to retrieve a clean state
      const serverState = JSON.parse(JSON.stringify(state))

      // set state properties based on received server info
      this.populateProperties(serverState, serverInfo)
      return serverState
    })
  }
}
