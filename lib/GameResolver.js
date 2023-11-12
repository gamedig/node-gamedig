import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs'

export default class GameResolver {
  constructor () {
    const loaded = this._readGames()
    this.gamesByKey = loaded.gamesByKey
    this.games = loaded.games
  }

  lookup (type) {
    if (!type) { throw Error('No game specified') }

    if (type.startsWith('protocol-')) {
      return {
        protocol: type.substring(9)
      }
    }

    const game = this.gamesByKey.get(type)

    if (!game) { throw Error('Invalid game: ' + type) }

    return game.options
  }

  printReadme () {
    let out = ''
    out += '| GameDig Type ID | Name | See Also\n'
    out += '|---|---|---\n'

    const sorted = this.games
      .filter(game => game.pretty)
      .sort((a, b) => {
        return a.pretty.localeCompare(b.pretty)
      })
    for (const game of sorted) {
      const keysOut = game.keys.map(key => '`' + key + '`').join('<br>')
      out += '| ' + keysOut.padEnd(10, ' ') + ' ' +
                '| ' + game.pretty
      const notes = []
      if (game.extra.doc_notes) {
        notes.push('[Notes](#' + game.extra.doc_notes + ')')
      }
      if (game.options.protocol === 'valve') {
        notes.push('[Valve Protocol](#valve)')
      }
      if (notes.length) {
        out += ' | ' + notes.join(', ')
      }
      out += '\n'
    }
    return out
  }

  _readGames () {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const gamesFile = path.normalize(__dirname + '/../games.txt')
    const lines = fs.readFileSync(gamesFile, 'utf8').split('\n')

    const gamesByKey = new Map()
    const games = []

    for (let line of lines) {
      // strip comments
      const comment = line.indexOf('#')
      if (comment !== -1) line = line.substring(0, comment)
      line = line.trim()
      if (!line) continue

      const split = line.split('|')
      const keys = split[0].trim().split(',')
      const name = split[1].trim()
      const options = this._parseList(split[3])
      options.protocol = split[2].trim()
      const extra = this._parseList(split[4])

      const game = {
        keys,
        pretty: name,
        options,
        extra
      }

      for (const key of keys) {
        gamesByKey.set(key, game)
      }

      games.push(game)
    }
    return { gamesByKey, games }
  }

  _parseList (str) {
    if (!str) { return {} }

    const out = {}
    for (const one of str.split(',')) {
      const equals = one.indexOf('=')
      const key = equals === -1 ? one : one.substring(0, equals)

      /** @type {string|number|boolean} */
      let value = equals === -1 ? '' : one.substring(equals + 1)

      if (value === 'true' || value === '') { value = true } else if (value === 'false') { value = false } else if (!isNaN(parseInt(value))) { value = parseInt(value) }

      out[key] = value
    }

    return out
  }
}
