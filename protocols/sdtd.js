import Valve from './valve.js'
import { Players } from '../lib/Results.js'

const playerLineRegex = /(?<=id=\d+,\s*)(?<name>\S[^,]*)(?=,)/
const modLineRegex = /^Mod\s+([^:]+):\s*([\d.]+)$/

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

    if (!this.options.requestPlayers && !this.options.moreData) {
      return
    }

    await this.telnetConnect({
      port: telnetPort,
      password: telnetPassword,
      passwordPrompt: /Please enter password:/i,
      shellPrompt: /\r\n$/,
      echoLines: 0
    })

    if (this.options.requestPlayers) {
      await this.telnetCallPlayers(state)
    }

    if (this.options.moreData) {
      await this.telnetMoreData(state)
    }

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

  async telnetMoreData (state) {
    const gettimeResponse = await this.telnetExecute('gettime')
    const dateTime = sanitizeTelnetResponse(gettimeResponse)[0] || ''
    const match = dateTime.match(/Day\s+(\d+),\s*(\d{2}:\d{2})/)

    if (match) {
      state.raw.day = Number(match[1])
      state.raw.time = match[2]
    }

    state.raw.telnetGettimeResponse = gettimeResponse

    const versionResponse = await this.telnetExecute('version')
    const version = sanitizeTelnetResponse(versionResponse)
    const gameVersions = version[0] || ''

    const versions = gameVersions.match(/V \d+\.\d+(?: \(b\d+\))?/g)

    if (versions) {
      state.raw.gameVersion = versions[0]
      state.raw.compatibilityVersion = versions[1]
    }

    const mods = []
    for (const possibleMod of version.slice(1)) {
      const match = possibleMod.match(modLineRegex)
      if (match) {
        mods.push({
          name: match[1],
          version: match[2]
        })
      }
    }

    state.raw.mods = mods
    state.raw.telnetVersionResponse = versionResponse
  }
}
