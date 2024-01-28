const { GameDig } = require('../dist/index.cjs')
// Instead of '../dist/index.cjs' you would have here 'gamedig'.

GameDig.query({
  type: 'minecraft',
  host: 'mc.hypixel.net',
  port: 25565, // lets us explicitly specify the query port of this server
  givenPortOnly: true // the library will attempt multiple ports in order to ensure success, to avoid this pass this option
}).then((state) => {
  console.log(state)
}).catch((error) => {
  console.log(`Server is offline, error: ${error}`)
})
