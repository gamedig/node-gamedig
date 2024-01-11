#!/usr/bin/env node

import * as process from 'node:process'

import Minimist from 'minimist'
import { GameDig } from './../lib/index.js'

const argv = Minimist(process.argv.slice(2), {
  boolean: ['pretty', 'debug', 'givenPortOnly', 'requestRules', 'requestRulesRequired', 'requestPlayersRequired'],
  string: ['guildId', 'listenUdpPort', 'ipFamily']
})

const options = {}
for (const key of Object.keys(argv)) {
  const value = argv[key]

  if (key === '_' || key.charAt(0) === '$') { continue }

  options[key] = value
}

// Separate host and port
if (argv._.length >= 1) {
  const target = argv._[0]
  const split = target.split(':')
  options.host = split[0]
  if (split.length >= 2) {
    options.port = split[1]
  }
}

const applyBoolean = (value, fieldName, defaultValue = true) => {
  if (value) {
    options[fieldName] = defaultValue
  }
}

const debug = argv.debug
const pretty = !!argv.pretty || debug
const givenPortOnly = argv.givenPortOnly
const requestRulesRequired = argv.requestRulesRequired
const requestPlayersRequired = argv.requestPlayersRequired

applyBoolean(debug, 'debug')
applyBoolean(givenPortOnly, 'givenPortOnly')
applyBoolean(requestRulesRequired, 'requestRulesRequired')
applyBoolean(requestPlayersRequired, 'requestPlayersRequired')

const printOnPretty = (object) => {
  if (pretty) {
    console.log(JSON.stringify(object, null, '  '))
  } else {
    console.log(JSON.stringify(object))
  }
}

const gamedig = new GameDig(options)
gamedig.query(options)
  .then(printOnPretty)
  .catch((error) => {
    if (debug) {
      if (error instanceof Error) {
        console.log(error.stack)
      } else {
        console.log(error)
      }
    } else {
      if (error instanceof Error) {
        error = error.message
      }

      printOnPretty({ error })
    }
  })
