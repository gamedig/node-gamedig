import { games } from './games.js'

export const lookup = (options) => {
  const type = options.type

  if (!type) { throw Error('No game specified') }

  if (type.startsWith('protocol-')) {
    return {
      protocol: type.substring(9)
    }
  }

  let game = games[type]

  if (options.checkOldIDs) {
    Object.keys(games).forEach((id) => {
      if (games[id]?.extra?.old_id === type) {
        game = games[id]
      }
    })
  }

  if (!game) { throw Error('Invalid game: ' + type) }

  return game.options
}
