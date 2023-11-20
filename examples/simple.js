import { GameDig } from '../lib/index.js'
// Instead of '../lib/index.js' you would have here 'gamedig'.

GameDig.query({
  type: 'minecraft',
  host: 'mc.hypixel.net'
}).then((state) => {
  console.log(state)
}).catch((error) => {
  console.log(`Server is offline, error: ${error}`)
})
