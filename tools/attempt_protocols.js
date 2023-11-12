import Minimist from 'minimist'
import GameDig from './../lib/index.js'

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

const protocols = ['valve', 'gamespy1', 'gamespy2', 'gamespy3', 'goldsrc', 'minecraft', 'quake1', 'quake2', 'quake3', 'unreal2', 'valve']

const run = async () => {
  for (const protocol of protocols) {
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
