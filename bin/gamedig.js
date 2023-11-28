#!/usr/bin/env node

import * as process from "node:process";

import Minimist from 'minimist'
import { GameDig } from './../lib/index.js'

const argv = Minimist(process.argv.slice(2), {
  boolean: ['pretty', 'debug', 'givenPortOnly', 'requestRules'],
  string: ['guildId', 'listenUdpPort', 'ipFamily']
})

const debug = argv.debug
delete argv.debug
const pretty = !!argv.pretty || debug
delete argv.pretty
const givenPortOnly = argv.givenPortOnly
delete argv.givenPortOnly

const options = {}
for (const key of Object.keys(argv)) {
  const value = argv[key]

  if (key === '_' || key.charAt(0) === '$') { continue }

  options[key] = value
}

if (argv._.length >= 1) {
  const target = argv._[0]
  const split = target.split(':')
  options.host = split[0]
  if (split.length >= 2) {
    options.port = split[1]
  }
}
if (debug) {
  options.debug = true
}
if (givenPortOnly) {
  options.givenPortOnly = true
}

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
