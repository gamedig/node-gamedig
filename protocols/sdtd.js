import Valve from './valve.js'
import { Players } from '../lib/Results.js'

const playerLineRegex = /(?<=id=\d+,\s*)(?<name>\S[^,]*)(?=,)/

const sanitizeTelnetResponse = response => {
  return response
    .split(/\r?\n/)
    .map(l => l.replace(/\r$/, '').trim())
    .filter(l => l.length > 0)
}

export default class sdtd extends Valve {
  async run (state) {
    await super.run(state)
    await this.telnetCalls(state)
  }

  async telnetCalls (state) {
    const telnetPort = this.options.telnetPort
    const telnetPassword = this.options.telnetPassword

    if (!telnetPort || !telnetPassword) {
      this.logger.debug('No telnet args given, skipping.')
      return
    }

    if (!this.options.requestPlayers) {
      return
    }

    await this.telnetConnect({
      port: telnetPort,
      password: telnetPassword,
      passwordPrompt: /Please enter password:/i,
      shellPrompt: /\r\n$/,
      echoLines: 0
    })

    await this.telnetCallPlayers(state)

    await this.telnetClose()
  }

  async telnetCallPlayers (state) {
    const playersResponse = await this.telnetExecute('listplayers')
    state.players = new Players()
    for (const possiblePlayerLine of sanitizeTelnetResponse(playersResponse)) {
      const match = possiblePlayerLine.match(playerLineRegex)

      const name = match?.groups?.name
      if (name) {
        state.players.push({
          name,
          responseLine: possiblePlayerLine
        })
      }
    }

    state.raw.telnetPlayersResponse = playersResponse
  }
}
