import { games } from '../lib/games.js'

const ids = Object.keys(games)

Object.keys(games).forEach((key) => {
  if (games[key].extra && games[key].extra.old_id) {
    const idOld = games[key].extra.old_id
    ids.push(idOld)
  }
})

function hasDuplicates(obj) {
  const uniqueSet = new Set()

  for (const item of obj) {
    if (uniqueSet.has(item)) {
      console.log('Duplicate:', item)
      return true
    }
    uniqueSet.add(item)
  }

  return false
}

if (hasDuplicates(ids)) {
  console.log('Duplicates found.')
} else {
  console.log('No duplicates found.')
}
