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

const columnDelimiter = '|'
const columnPadLeft = 1
const columnPadRight = 1

const HeaderType = {
  ID: 0,
  GameName: 1,
  Notes: 2
}
const HeaderNames = {
  [HeaderType.ID]: { Name: 'GameDig Type ID' },
  [HeaderType.GameName]: { Name: 'Name' },
  [HeaderType.Notes]: { Name: 'See Also' }
}
// defines the order of columns
const HeaderDefinition = [
  HeaderType.ID,
  HeaderType.GameName,
  HeaderType.Notes
]

const headerMap = HeaderDefinition.map(idx => Object.values(HeaderType)[idx])
const headers = Object.keys(HeaderType).map((x, idx) => HeaderNames[idx].Name)

const matrix = []
const maxLength = headers.map(x => x?.length ?? 0)
Object.entries(sortedGames).forEach(([id, game]) => {
  const lineArray = Array(headerMap.length).fill('')
  lineArray[HeaderType.ID] = id
  lineArray[HeaderType.GameName] = game.name

  const notes = []
  if (game?.extra?.doc_notes) {
    notes.push('[Notes](#' + game.extra.doc_notes + ')')
  }
  if (['valve', 'dayz', 'sdtd'].includes(game.options.protocol)) {
    notes.push('[Valve Protocol](#valve)')
  }
  if (['epic', 'asa', 'theisleevrima', 'renown', 'squad'].includes(game.options.protocol)) {
    notes.push('[EOS Protocol](#epic)')
  }
  lineArray[HeaderType.Notes] = notes.join(', ')

  lineArray.forEach((x, index) => {
    maxLength[index] = Math.max(maxLength[index], x?.length ?? 0)
  })
  matrix.push(lineArray)
})

matrix.splice(0, 0, headers)
const padLeft = ' '.repeat(columnPadLeft)
const padRight = ' '.repeat(columnPadRight)
const lines = matrix.map(row => {
  const values = headerMap.map((x, idx) => {
    return padLeft + row[x].padEnd(maxLength[x], ' ') + padRight
  })
  return `${columnDelimiter}${''}${values.join(columnDelimiter)}${columnDelimiter}`
})
const headerSeps = ['', ...headerMap.map(x => '-'.repeat(maxLength[x] + columnPadLeft + columnPadRight)), '']
const headerSep = `${headerSeps.join(columnDelimiter)}`
lines.splice(1, 0, headerSep)
const generated = lines.join('\n')

let start = readme.indexOf(markerTop)
const end = start >= 0 ? readme.indexOf(markerBottom) : 0
start = Math.max(0, start) + (start >= 0 ? markerTop.length : 0)

const updated = readme.substring(0, start) + '\n' + generated + '\n' + readme.substring(end)
fs.writeFileSync(readmeFilename, updated)
