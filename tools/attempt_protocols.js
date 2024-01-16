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
}

const gamedig = new GameDig(options)

const run = async () => {
  for (const protocol of Object.keys(protocols)) {
    try {
      const response = await gamedig.query({
        ...options,
        debug: true,
        type: `protocol-${protocol}`
      })
      console.log(response)
      process.exit()
    } catch (e) {
      console.log(`Error on '${protocol}': ${e}`)
    }
  }
}

run().then(() => {})
