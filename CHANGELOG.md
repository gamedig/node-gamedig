
### To Be Released...
#### Breaking Changes
* None

#### Other changes
* None

### 4.3.1
* Fixed support for the Minecraft [Better Compatibility Checker](https://www.curseforge.com/minecraft/mc-mods/better-compatibility-checker) Mod (By @Douile, #436).
* Added a -1 query port offset for Rising World (#441).

### 4.3.0
* Fix `Post Scriptum` not being on the valve protocol.
* Fix `Epic` protocol's `numplayers` not being in the `raw` field.
* Added support for the Minecraft [Better Compatibility Checker](https://www.curseforge.com/minecraft/mc-mods/better-compatibility-checker) Mod.
* Halo Online (ElDewrito) - Added support (by @Sphyrna-029)

### 4.2.0
* Renamed `Counter Strike: 2D` to `CS2D` in [games.txt](games.txt) (why? see [this](https://cs2d.com/faq.php?show=misc_name#misc_name)).
* Updated `CS2D` protocol (by @ernestpasnik)
* Capitalize `Unturned` name in `games.txt`.
* Fix an edge-case of the `Doom3` protocol that did not parse the correct field for max players.
* Eco (2018) - Added support (requested by @dgibbs64)
* Core Keeper (2022) - Added support (by @dgibbs64)
* ARMA: Reforger (2022) - Added support (by @dgibbs64)
* Action Half-Life - Added support (by @dgibbs64).
* Action: Source (2019) - Added support (by @dgibbs64).
* Base Defense (2017) - Added support (by @dgibbs64).
* Blade Symphony (2014) - Added support (by @dgibbs64).
* Brainbread - Added support (by @dgibbs64).
* Deathmatch Classic (2001) - Added support (by @dgibbs64).
* Double Action: Boogaloo (2014) - Added support (by @dgibbs64).
* Dystopia (2005) - Added support (by @dgibbs64).
* Empires Mod (2008) - Added support (by @dgibbs64).
* Fistful of Frags (2014) - Added support (by @dgibbs64).
* Half-Life: Opposing Force (1999) - Added support (by @dgibbs64).
* Pirates, Vikings, and Knights II (2007) - Added support (by @dgibbs64).
* Project Cars (2015) - Added support (by @dgibbs64).
* Project Cars 2 (2017) - Added support (by @dgibbs64).
* The Specialists - Added support (by @dgibbs64).
* Vampire Slayer - Added support (by @dgibbs64).
* Warfork (2018) - Added support (by @dgibbs64).
* Wurm Unlimited (2015) - Added support (by @dgibbs64).
* The Forest (2014) - Added support.
* Operation: Harsh Doorstop (2023) - Added support.
* Insurgency: Modern Infantry Combat (2007) - Added support.
* Counter-Strike 2 (2023) - Added support.
* The Front (2023) - Added support.
* San Andreas OpenMP - Added support.
* ARK: Survival Ascended (2023) - Added support (by @GuilhermeWerner).

### 4.1.0
* Replace `compressjs` dependency by `seek-bzip` to solve some possible import issues.
* Sons Of The Forest (2023) - Added support
* Red Dead Redemption 2 - RedM (2018) - Added support
* Creativerse (2017) - Added support
* The Isle (2015) - Added support

### 4.0.7
* Updated some dependencies to solve vulnerabilities
* Fixed an issue regarding GameSpy 1 not correctly checking and parsing for numbers.
* Risk of Rain 2 (2019) - Added support
* Survive the Nights (2017) - Added support
* V Rising (2022) - Added support
* Day of Dragons (2019) - Added support
* Onset (2019) - Added support
* Don't Starve Together (2016) - Added support
* Chivalry: Medieval Warfare (2012) - Added support
* Avorion (2020) - Added support
* Black Mesa (2020) - Added support
* Ballistic Overkill (2017) - Added support
* Codename CURE (2017) - Added support
* Colony Survival (2017) - Added support
* Rising World (2014) - Added support
* BrainBread 2 (2016) - Added support

### 4.0.6
* Fixed ping returned by minecraft queries
* Added ipFamily option to query only ipv4 or only ipv6 dns records

### 4.0.5
* Fixed filtering out fake "Max Players" player on CSGO
* Removed moment dependency

### 4.0.4
* Updated dependencies

### 4.0.3
* Fixed nodejs version requirement in package.json (node 14 has been required since gamedig 4)
* Ground Breach (2018) - Added support
* Minecraft (All Versions) - Fixed character encoding for strings returned by servers using Geyser
* Barotrauma (2019) - Added support

### 4.0.2
* Counter-Strike 1.5 - Fixed support

### 4.0.1
* Rust - Fixed maxplayers >255
* dayZ - Fixed tag info not parsing when queryRules wasn't set

### 4.0.0

#### Breaking Changes
* NodeJS 14 is now required

#### Other changes
* Dependencies are updated
* Node 14 is now required due to new requirement in `got` dependency

### 3.0.9
* Fixes player info parsing issues on bf1942-based mods (Thanks cetteup)
* Adds Project Zomboid support (Thanks xhip)
* Adds Post Scriptum support (Thanks arkuar)
* Adds some more DayZ info to state.raw (Thanks podrivo)
* Updates to README regarding DayZ (Thanks podrivo)
* Improvements to DayZ mod parsing from additional more recent reverse engineering (probably still buggy)
* Fixes ping always being 0 for minecraft servers
* Adds README documentation about teamspeakQueryPort

### 3.0.8
* Fixes player array corruption on some protocols which only report player counts without names (Thanks to a-sync)
* Fixes minecraft protocol not using player list from bedrock protocol in some cases

### 3.0.7
* Fixes corrupted dayzMods when packet overflow is present

### 3.0.6
* raw.tags for valve servers is now an array rather than a string
* The special mod list for dayz servers is now parsed into raw.dayzMods is requestRules is set to true
* DayZ queue length, day and night acceleration are now parsed into raw as well

### 3.0.5
* Add support for `listenUdpPort` to specify a fixed bind port.
* Improved udp bind failure detection.

### 3.0.4
* Add support for Discord widget

### 3.0.3
* Greatly improve gamespy1 protocol, with additional error handling and xserverquery support.

### 3.0.2
* Fix player name extraction for Unreal Tournament (1999) and possibly
  other gamespy1 games.

### 3.0.1
* Clarified that nodejs 12 is now required for gamedig 3
* Fixed misc player fields not going into `raw` subobject in `assettocorsa`, `fivem`, and `gamespy2`

### 3.0.0
Major Changes:
* **NodeJS 12 is now required**
* The `name` field is now guaranteed to exist on all player objects. If a player's name is unknown, the `name` will be an empty string.
* All non-`name` player fields have been moved into a `raw` sub-field. This means that, like the `raw` subobject of the parent
  response, all non-`name` fields are now considered to be unstable and may be changed during minor releases of GameDig.
* "Rules" are no longer queried for `valve` protocol games by default. Many games do not respond to this query anyways (meaning we have to wait
  for timeout), and its contents is often not even used since it only exists in the raw subfield. If you depend on rules,
  you may pass the `requestRules: true` option to re-enable them.
* The `raw.steamappid` and `raw.gameid` fields for valve games have been consolidated into `raw.appId`.

### 2.0.28
* Added Valheim (2021)

### 2.0.27
* Reduced chance of protocol collisions between gamespy3 and minecraftbedrock

### 2.0.26
* Added support for the native minecraft bedrock protocol, since some
bedrock servers apparently do not respond to the gamespy3 protocol.

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
