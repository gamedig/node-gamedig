### 2.0.25
* Support challenges in A2S_INFO (upcoming change to valve protocol)

### 2.0.24
* Add Savage 2: A Tortured Soul (2008)

### 2.0.23
* Fix Conan Exiles and other games which don't respond to the valve player query
* Add givenPortOnly query option for users that require extreme optimization

### 2.0.22
* Updated dependencies

### 2.0.21
* Added Assetto Corsa (2014)
* Fixed password flag for Squad
* Added Mordhau (2019)
* Fixed player count being incorrect in minecraftvanilla protocol in some cases
* Updated dependencies
* Replaced deprecated Request http library with Got

### 2.0.20
* Fixed minecraft protocol never throwing exceptions

### 2.0.19
* Added Days of War (2017)
* Added The Forrest (2014)
* Added Just Cause 3 Multiplayer (2017)
* Added Project Reality: Battlefield 2 (2005)
* Added Quake Live (2010)
* Added Contagion (2011)
* Added Empyrion: Galactic Survival (2015)
* Added PixARK (2018)

### 2.0.16, 2.0.17, 2.0.18
* Various improvements to killing floor / unreal2 protocol

### 2.0.15
* Added Hell Let Loose
* Added Rising Storm 2: Vietnam
* Added Squad
* Fixed DNS lookup not working in some situations when dns.lookup unexpectedly returns a string
* Improved minecraft protocol for non-vanilla server implementations (bedrock, waterfall, bungeecord)
* Updated dependencies

### 2.0.14
* Node 8 compatibility fixes

### 2.0.13
* Improved logging

### 2.0.12
* Servers are now limited to 10000 players to prevent OOM
* Improvements to Starmade (2012)
* Added Atlas (2018)

### 2.0.11
* Added Acra Sim Racing
* Added Mafia 2: Online

### 2.0.10
* Added rFactor

### 2.0.9
* Added Vice City: Multiplayer

### 2.0.8
* Improve out-of-order packet handling for gamespy1 protocol
* Work-around for buggy duplicate player reporting from bf1942 servers
* Report team names rather than IDs when possible for gamespy1 protocol

### 2.0.7
* Prevent tcp socket errors from dumping straight to console

### 2.0.6
* Added support for host domains requiring Punycode encoding (special characters)

### 2.0.5
* Added support for Counter-Strike: 2D

### 2.0.4
* Added details about new 2.0 reponse fields to the README.

### 2.0.3
* Added support for Insurgency: Sandstorm

### 2.0.2
* Added support for Starsiege 2009 (starsiege)

### 2.0.1
* Updated readme games list for 2.0
* Fixed csgo default port

### 2.0.0

##### Breaking API changes
* **Node 8 is now required**
* Removed the `port_query` option. You can now pass either the server's game port **or** query port in the `port` option, and 
GameDig will automatically discover the proper port to query. Passing the query port is more likely be successful in
unusual cases, as otherwise it must be automatically derived from the game port.
* Removed `callback` parameter from Gamedig.query. Only promises are now supported. If you would like to continue
using callbacks, you can use node's `util.callbackify` function to convert the method to callback format.
* Removed `query` field from response object, as it was poorly documented and unstable.
* Removed `notes` field from options / response object. Data can be passed through a standard javascript context if needed.

##### Minor Changes
* Rewrote core to use promises extensively for better error-handling. Async chains have been dramatically simplified
by using async/await across the codebase, eliminating callback chains and the 'async' dependency.
* Replaced `--output pretty` cli parameter with `--pretty`.
* You can now query from CLI using shorthand syntax: `gamedig --type <gameid> <ip>[:<port>]`
* UDP socket is only opened if needed by a query.
* Automatic query port detection -- If provided with a non-standard port, gamedig will attempt to discover if it is a
game port or query port by querying twice: once to the port provided, and once to the port including the game's query
port offset (if available).
* Added new `connect` field to the response object. This will typically include the game's `ip:port` (the port will reflect the server's
game port, even if you passed in a query port in your request). For some games, this may be a server ID or connection url
if an IP:Port is not appropriate.
* Added new `ping` field (in milliseconds) to the response object. As icmp packets are often blocked by NATs, and node has poor support
for raw sockets, this time is derived from the rtt of one of the UDP requests, or the time required to open a TCP socket
during the query.
* Improved debug logging across all parts of GameDig
* Removed global `Gamedig.debug`. `debug` is now an option on each query.

##### Protocol Changes
* Added support for games using older versions of battlefield protocol.
* Simplified detection of BC2 when using battlefield protocol.
* Fixed buildandshoot not reading player list
* Standardized all doom3 games into a single protocol, which can discover protocol discrepancies automatically.
* Standardized all gamespy2 games into a single protocol, which can discover protocol discrepancies automatically.
* Standardized all gamespy3 games into a single protocol, which can discover protocol discrepancies automatically.
* Improved valve protocol challenge key retry process

### 1.0.0
* First official release
* Node.js 6 is now required
