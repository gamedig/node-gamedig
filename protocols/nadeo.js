import Core from './core.js'
import Promises from '../lib/Promises.js'
import * as gbxremote from 'gbxremote'

export default class nadeo extends Core {
  async run (state) {
    await this.withClient(async client => {
      const start = Date.now()
      await this.query(client, 'Authenticate', this.options.login, this.options.password)
      this.registerRtt(Date.now() - start)

      {
        const results = await this.query(client, 'GetServerOptions')
        state.name = this.stripColors(results.Name)
        state.password = (results.Password !== 'No password')
        state.maxplayers = results.CurrentMaxPlayers
        state.raw.maxspectators = results.CurrentMaxSpectators
        state.raw.GetServerOptions = results
      }

      {
        const results = await this.query(client, 'GetCurrentChallengeInfo')
        state.map = this.stripColors(results.Name)
        state.raw.GetCurrentChallengeInfo = results
      }

      {
        const results = await this.query(client, 'GetCurrentGameInfo')
        let gamemode = ''
        const igm = results.GameMode
        if (igm === 0) gamemode = 'Rounds'
        if (igm === 1) gamemode = 'Time Attack'
        if (igm === 2) gamemode = 'Team'
        if (igm === 3) gamemode = 'Laps'
        if (igm === 4) gamemode = 'Stunts'
        if (igm === 5) gamemode = 'Cup'
        state.raw.gametype = gamemode
        state.raw.mapcount = results.NbChallenge
        state.raw.GetCurrentGameInfo = results
      }

      {
        const results = await this.query(client, 'GetVersion')
        state.version = results.Version
        state.raw.GetVersion = results
      }

      if (this.options.port === 5000) {
        state.gamePort = 2350
      }

      state.raw.players = await this.query(client, 'GetPlayerList', 10000, 0)
      for (const player of state.raw.players) {
        state.players.push({
          name: this.stripColors(player.Name || player.NickName)
        })
      }
      state.numplayers = state.players.length
    })
  }

  async withClient (fn) {
    const socket = new gbxremote.Client(this.options.port, this.options.host)
    try {
      const connectPromise = socket.connect()
      const timeoutPromise = Promises.createTimeout(this.options.socketTimeout, 'GBX Remote Opening')
      await Promise.race([connectPromise, timeoutPromise, this.abortedPromise])
      return await fn(socket)
    } finally {
      socket.terminate()
    }
  }

  async query (client, command, ...args) {
    const params = args.slice()

    const sentPromise = client.query(command, params)
    const timeoutPromise = Promises.createTimeout(this.options.socketTimeout, 'GBX Method Call')
    return await Promise.race([sentPromise, timeoutPromise, this.abortedPromise])
  }

  stripColors (str) {
    return this.options.stripColors ? str.replace(/\$([0-9a-f]{3}|[a-z])/gi, '') : str
  }
}
