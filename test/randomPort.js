const GameDig = require( '../lib/index.js' )

var servers = [['45.32.246.255','28036'], ['108.61.227.175','28016'], ['139.99.144.13','49075'], ['108.61.227.148', '28016'], ['45.121.210.41', '49115'], ['139.99.144.70', '28009'], ['139.99.144.49', '28221'], ['108.61.227.38', '28016'], ['45.121.210.41', '49185'], ['45.121.211.142', '49285'], ['221.121.158.121', '28035'], ['45.63.29.74', '28016']]

var jobs = []
servers.map((server) => {
	jobs.push(
		GameDig.query({ type: 'rust', host: server[0], port: server[1]})
		.then( details => { console.log( "Got server:", details.name )})
		.catch( e => {console.log('Error:', e)})
	)
})

Promise.all( jobs )
.then( details => {console.log("Done")})
.catch( err => {console.log("Failed", err)} )