import Valve from './valve.js'
import { Players } from '../lib/Results.js'

const playerRegex = /(?<=id=\d+,\s*)(?<name>\S[^,]*)(?=,)/
const gameVersionsRegex = /V \d+\.\d+(?: \(b\d+\))?/g
const modRegex = /^Mod\s+([^:]+):\s*([\d.]+)$/
const dateTimeRegex = /Day\s+(\d+),\s*(\d{2}:\d{2})/

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
      const match = possiblePlayerLine.match(playerRegex)

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
    const match = dateTime.match(dateTimeRegex)
    if (match) {
      state.raw.day = Number(match[1])
      state.raw.time = match[2]
      state.raw.hordeDay = state.raw.day % 7 === 0
    } else {
      state.raw.hordeDay = false
    }

    state.raw.telnetGettimeResponse = gettimeResponse

    const versionResponse = await this.telnetExecute('version')
    const versions = sanitizeTelnetResponse(versionResponse)
    const gameVersions = versions[0] || ''
    const gameVersionsMatch = gameVersions.match(gameVersionsRegex)
    if (gameVersionsMatch) {
      state.raw.gameVersion = gameVersionsMatch[0]
      state.raw.compatibilityVersion = gameVersionsMatch[1]
    }

    const mods = []
    for (const possibleMod of versions.slice(1)) {
      const match = possibleMod.match(modRegex)
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
