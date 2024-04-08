#!/usr/bin/env node

import * as fs from 'node:fs'
import { games } from '../lib/games.js'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const readmeFilename = __dirname + '/../GAMES_LIST.md'
const readme = fs.readFileSync(readmeFilename, { encoding: 'utf8' })

const markerTop = '<!--- BEGIN GENERATED GAMES -->'
const markerBottom = '<!--- END GENERATED GAMES -->'

const sortedGamesIds = Object.keys(games).sort()
const sortedGames = {}
sortedGamesIds.forEach(key => {
  sortedGames[key] = games[key]
})

let generated = ''
generated += '| GameDig Type ID | Name | See Also\n'
generated += '|---|---|---\n'

for (const id in sortedGames) {
  const game = sortedGames[id]
  generated += '| ' + id.padEnd(10, ' ') + ' | ' + game.name
  const notes = []
  if (game?.extra?.doc_notes) {
    notes.push('[Notes](#' + game.extra.doc_notes + ')')
  }
  if (game.options.protocol === 'valve' || game.options.protocol === 'dayz') {
    notes.push('[Valve Protocol](#valve)')
  }
  if (game.options.protocol === 'epic' || game.options.protocol === 'asa' || game.options.protocol === 'theisleevrima') {
    notes.push('[EOS Protocol](#epic)')
  }
  if (notes.length) {
    generated += ' | ' + notes.join(', ')
  }
  generated += '\n'
}

let start = readme.indexOf(markerTop)
start += markerTop.length
const end = readme.indexOf(markerBottom)

const updated = readme.substring(0, start) + '\n\n' + generated + '\n' + readme.substring(end)
fs.writeFileSync(readmeFilename, updated)
