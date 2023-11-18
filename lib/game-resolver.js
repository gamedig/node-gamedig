import { games } from './games.js'

export const lookup = (type) => {
  if (!type) { throw Error('No game specified') }

  if (type.startsWith('protocol-')) {
    return {
      protocol: type.substring(9)
    }
  }

  const game = games[type]

  if (!game) { throw Error('Invalid game: ' + type) }

  return game.options
}
