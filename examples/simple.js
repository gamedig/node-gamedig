import { GameDig } from '../lib/index.js'
// Instead of '../lib/index.js' you would have here 'gamedig'.

GameDig.query({
  type: 'minecraft',
  host: 'mc.hypixel.net',
  port: 25565, // let us explicitly specify the port
  givenPortOnly: true // gamedig will try to attempt multiple ports to ensure success, disable that with this option
}).then((state) => {
  console.log(state)
}).catch((error) => {
  console.log(`Server is offline, error: ${error}`)
})
