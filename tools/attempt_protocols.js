import Minimist from 'minimist'
import { GameDig } from './../lib/index.js'
import * as protocols from './../protocols/index.js'

const argv = Minimist(process.argv.slice(2), {})

const options = {}
if (argv._.length >= 1) {
  const target = argv._[0]
  const split = target.split(':')
  options.host = split[0]
  if (split.length >= 2) {
    options.port = split[1]
  }
  options.debug = argv._[1] === 'debug'
}

const gamedig = new GameDig(options)

const protocolList = []
Object.keys(protocols).forEach((key) => protocolList.push(key))

const services = ['discord', 'beammpmaster', 'beammp', 'teamspeak2', 'teamspeak3']
const protocolListFiltered = protocolList.filter((protocol) => !services.includes(protocol))

const run = async () => {
  for (const protocol of protocolListFiltered) {
    try {
      const response = await gamedig.query({
        ...options,
        type: `protocol-${protocol}`
      })
      console.log(`Success on '${protocol}':`, response)
      process.exit()
    } catch (e) {
      console.log(`Error on '${protocol}': ${e}`)
    }
  }
}

run().then(() => {})
