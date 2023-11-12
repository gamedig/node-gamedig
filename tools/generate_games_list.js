#!/usr/bin/env node

import * as fs from 'node:fs'
import GameResolver from '../lib/GameResolver.js'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const gameResolver = new GameResolver()

const generated = gameResolver.printReadme()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const readmeFilename = __dirname + '/../GAMES_LIST.md'
const readme = fs.readFileSync(readmeFilename, { encoding: 'utf8' })

const markerTop = '<!--- BEGIN GENERATED GAMES -->'
const markerBottom = '<!--- END GENERATED GAMES -->'

let start = readme.indexOf(markerTop)
start += markerTop.length
const end = readme.indexOf(markerBottom)

const updated = readme.substring(0, start) + '\n\n' + generated + '\n' + readme.substring(end)
fs.writeFileSync(readmeFilename, updated)
