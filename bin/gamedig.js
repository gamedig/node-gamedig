#!/usr/bin/env node

import * as process from 'node:process'

import Minimist from 'minimist'
import { GameDig } from './../lib/index.js'

const argv = Minimist(process.argv.slice(2), {
  boolean: ['pretty', 'debug', 'givenPortOnly', 'requestRules', 'requestPlayers', 'requestRulesRequired', 'requestPlayersRequired', 'stripColors', 'portCache', 'noBreadthOrder', 'checkOldIDs', 'rejectUnauthorized'],
  string: ['guildId', 'serverId', 'listenUdpPort', 'ipFamily', 'token'],
  default: {
    stripColors: true,
    portCache: true,
    requestPlayers: true
  }
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
  if (split.length > 1) {
    options.port = split[1]
  }
}

const { debug, pretty } = options

const printOnPretty = (object) => {
  if (!!pretty || debug) {
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
