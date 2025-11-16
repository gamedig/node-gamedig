
## To Be Released...
## 5.X.Y
* Fix: ignore stale player list entries (By @cetteup #744)

## 5.3.2
* Fix: detect BFBC2 Vietnam DLC as BFBC2 (By @cetteup #713)
* Feat: SCP: Secret Laboratory (2020) - Added support (#715, thanks @Draakoor)
* Fix: Farming Simulator handle possible missing mod attribute (By @yellowfromseegg #723)
* Fix: BeamMP would not match on given port (#730)
* Fix: version field would sometimes be a Number type (#735)
* Feat: Squad - Replace Valve protocol with EOS protocol (By @k3ithos #731)
* Feat: Clive Barker's Undying - Added support (By @dgibbs64 #733)
* Chore: Update `iconv-lite` from `0.6.3` to `0.7.0` (#737)
* Fix: ASA - change EOS usage (#739, thanks @mze9412)

## 5.3.1
* Fix: HTTP requests would end up making more retries than needed due to got's internal retry mechanism (#690, thanks @RattleSN4K3)
* Feat: 7 Days to Die add Telnet support for missing player names (#692, thanks @jammsen)
* Feat: 7 Days to Die get more optional Telnet data via an option (#693)
* Feat: Update OpenTTD (By @mwkaicz #695)
* Fix: Skip non-response packets in protocol-battlefield (By @cetteup #704)
* Fix: throwing in tcpSend onData callback would crash gamedig (#705, thanks @cetteup)
* Fix: ignore cached ports when givenPortOnly is set (By @cetteup #710)

## 5.3.0
* Docs: Arma Reforger query setup note (#670, thanks @xCausxn)
* Fix: Grand Theft Auto V - FiveM wrap the players query in a try block as it doesn't provide the data by default anymore (#674, thanks @xCausxn)
* Docs: Counter-Strike 2 does not provide players names, note this and a plugin workaround (#675).
* Fix: Minetest - server filtering replace missing field ip with address (By @hjri #678)
* Docs: Arma Reforger does not provide players data (#680)
* Feat: Farming Simulator add response to raw object (#682)
* Feat: Renown (2025) - Added support (#684 By @anthonyphysgun)
* Fix: Terraria - add missing supported maxplayers field and raw field (By @GoodDays13 #686)
* Chore: Replace cheerio with fast-xml-parser (By @xCausxn #683)
* Fix: Build and Shoot protocol using the new json status server (By @xCausxn #683)
* Chore: Update `long` from `5.2.3` to `5.3.2` (#687)

## 5.2.0
* Fix: Palworld not respecting query output players schema (#666)
* Fix: Minecraft name being duplicated in the name string (#656)
* Fix: Use `cp` tag to get player count on Rust (By @xCausxn #663)
* Fix: Nadeo failing queries on map info (also added version field) (#667 with @Hornochs)
* Feat: Farming Simulator 25 (2024) - Added support (#660)
* Feat: Exfil (2024) - Added support (#661)
* Docs: Valheim numplayers being always 0 on crossplay servers (#668)

## 5.1.4
* Feat: Replaced `punycode` package usage with `url.domainToASCII` (#630).
* Feat: World of Padman (2007) - Added support (#636)
* Feat: Satisfactory - Added support (By @Smidy13 #645, #652, #653)
* Feat: Update Soldat protocol (#642)
* Feat: TOXIKK (2016) - Added support (#641)
* Feat: Renegade X (2014) - Added support (#643)
* Feat: Hawakening (2024) - Added support (#648)
* Feat: BROKE PROTOCOL (2024) - Added support (#651)

## 5.1.3
* Fix: `Deus Ex` using the wrong protocol (#621)
* Fix: `Soldier of Fortune` using the wrong protocol (#623)
* Feat: Serious Sam: The Second Encounter (2002) - Added support (#625)
* Feat: Icarus (2021) - Added support (By @xCausxn #626)
* Feat: For the Quake2 protocol `version`'s field, also look for `version` in the raw object
* Feat: Add option `requestPlayers`, defaults to `true`.

## 5.1.2
* Added Vintage Story support via the master server (#606)
* Fixed `registerRtt` breaking successful queries if it didn't respond in the query timeout (#610)
* Added support for rFactor 2 (By @xCausxn #614)

## 4.3.2
* Locked dependencies versions

## 5.1.1
* Lock dependencies to fix problems with cheerio's `1.0.0` release and update punycode to `2.3.1` to mitigate
a vulnerability (#604)
* Fix the `name` field on Minecraft servers: 
* * running Velocity with multiple layers of color encoding (#595)
* * the top-level text of the description is a string composed of empty characters (#599)
* Fix branding for alt:V Multiplayer (By @xCausxn #600)
* Added [Bun](https://bun.sh/) runtime support (#596)
* Added a rules bytes return for valve protocol (By @blackwaterbread #597)

## 5.1.0
* FOUNDRY - Added support (#585)
* Grand Theft Auto V: AltVMP - Added support (By @xCausxn #588)
* Fix ability to manual set `state.connect` (By @xCausxn #588)

## 5.0.1
* Minetest - Added support for minetest utilizing official server list (By @xCausxn #573)
* Soulmask - Added support (By @xCausxn #572)
* Fix Minecraft's missing favicon from response (#575)
* Grand Theft Auto V: Rage MP - Added support (By @xCausxn #576)
* Fix duplicate game entry for The Forest (2014), add old id for backwards compatibility (By @xCausxn #579)
* Fix Xonotic player's names being numbers and their names being in the "raw" field (#580)

## 5.0.0
* Added a new stabilized field `version` in the query response (By @podrivo #532)
* Euro Truck Simulator 2 (2012) - Added support (By @podrivo #523)
* Eco - Fixed querying servers using reverse queries and player names (By @Vito0912 #526)
* Factorio (2016) - Added support (By @Vito0912 #527)
* Farming Simulator 22 (2021) - Added support (By @Vito0912 #531)
* Farming Simulator 19 (2018) - Added support (By @Vito0912 #531)
* Assetto Corsa - Fixed how `state.numplayers` is set (By @podrivo #538)
* TeamSpeak 2 - Fixed how `state.name` is set (By @podrivo #544)
* Grand Theft Auto: San Andreas OpenMP - Fixed `state.players` returning an empty array (By @Focus04 #547) 
* Perf: Re-write of the `core` class.
* Perf: Remove many if statements from `GameSpy2`.
* Myth of Empires - Added support.
* Fix: BeamMP maxplayers that was displaying player count (By @dgibbs64 #551)
* Fix: BeamMP filter servers by address, not host (By @Rephot #558)
* Palworld - Replace old and broken protocol with the new one (#560)
* Nova-Life: Amboise - Added support.
* Abiotic Factor - Added Support.

## 5.0.0-beta.2
* Fixed support for projects using `require`.

## 5.0.0-beta.1
* Fixed numplayers on Palworld not beeing accurate
* Enshrouded - Added support (By @GuilhermeWerner #512).
* Fixed typo in standard port on Palworld (By jammsen #515)
* Re-added support for projects using `require` (By @GuilhermeWerner #519).
* Duke Nukem Forever 2001 (2022) - Added support (By @podrivo #499)

## 5.0.0-beta.0
### Breaking Changes
#### Package
* Node.js 16.20 is now required (from 14).
* Made the library a `module`.
* Removed `GameResolver`, moved the `GameDig` class in a separate file.
* Modified exports, now the library exports `games` and `protocols` alongside the `GameDig` class.
  * Many game ids have changed, see the [migrate ids](MIGRATE_IDS.md) file for more info regarding this.
  * A game always has these fields: `name`, `release_year` and `options` (which always contains `port`/`port_query`/`port_query_offset` and `protocol`) and could contain `extra.old_id`.
* `maxAttempts` has been renamed to `maxRetries`.

#### Games
* Almost all games ids have been changed to follow a standard, see [CONTRIBUTING.md#naming](https://github.com/gamedig/node-gamedig/blob/5ae12dd494c927abcbe43352609d9aa34a54753c/CONTRIBUTING.md?plain=1#L27C3-L27C3).
* Removed `minecraftping` (as it was deprecated and the same thing as `minecraft`) and 
`minecraftpe` (deprecated, which is now the same as `mbe` (Minecraft Bedrock Edition)).
* Removed the `games.txt` file, the games definitions are now stored in-code (exported on `games`).

### Other changes
#### Package
* Replaced usage of deprecated `substr` with `substring`.
* Replaced deprecated internal `punycode` with the [punycode](https://www.npmjs.com/package/punycode) package.
* Updated dependencies:
  * [got](https://github.com/sindresorhus/got) from 12.1 to 13.
  * [minimist](https://github.com/minimistjs/minimist) from 1.2.6 to 1.2.8.
  * [long](https://github.com/dcodeIO/long.js) from 5.2.0 to 5.2.3.
  * @types/node from 14.18.13 to 16.18.58.
  * [cheerio](https://github.com/cheeriojs/cheerio) from 1.0.0-rc.10 to 1.0.0-rc.12.
* Added eslint which spotted some unused variables and other lints.
* CLI: Resolved incorrect error message when querying with a non-existent protocol name.
* Added Deno support: the library and CLI can now be experimentally used with the [Deno runtime](https://deno.com)
  * Minimum Supported Deno Version: `1.39.2`.
  * `deno run --allow-net bin/gamedig.js --type tf2 127.0.0.1`
* Added code examples.
* New stable field: `queryPort` - this number indicates what was the port that the query was done on, 0 indicates none if not applicable.
* Fixed `numplayers` not having a default value.
* New options:
  * `portCache` (defaults to `true`) after you queried a server, the second time you query that exact server (identified by specified ip and port), first add an attempt to query with the last successful port.
  * `stripColors` (defaults to `true`) for protocols that strips colors: unreal2, savage2, quake3, nadeo, gamespy2, doom3, armagetron.
  * `requestRulesRequired` (defaults to `false`) Valve games only. `requestRules` is always required to have a response or the query will timeout.
  * `requestPlayersRequired` (defaults to `false`) Valve games only. Querying players is always required to have a response or the query will timeout. Some [games](GAMES_LIST.md) may not provide a players response.
  * `noBreadthOrder` (defaults to `false`). If multiple attempts are to be made, disable doing one of each type until reaching the retry count.
  * `checkOldIDs` (defaults to `false`). Query will check for older game type IDs. See [migration](MIGRATION.md) document.
* Now documented: `address` (defaults to `undefined`) Override the IP address of the server skipping DNS resolution. When set, host will not be resolved, instead address will be connected to. However, some protocols still use host for other reasons e.g. as part of the query.

#### Games
* Removed the players::setNum method, the library will no longer add empty players as 
placeholders in the `players` fields.
* Valve: dont skip players with no name and keep state.raw.players.
* Stabilized field `numplayers`.
* Add note about EOS Protocol not providing players data.
* V Rising (2022) - Updated `options.port_query_offset` to `[1, 15]` (#438).
* Minecraft (2009) - Add note about players data.
* Fixed Project Cars and Project Cars 2 port offsets.
* Fixed Wurm Unlimited port_query being missnamed.
* BeamMP (2021) - Added support.
* Xonotic (2011) - Added support.
* Call of Duty: Black Ops 3 (2015) - Added support.
* Unreal 2: The Awakening - XMP - Added support.
* Palworld - Added support (By @jonathanprl, #495).
* The Isle Evrima - Added support (By @GuilhermeWerner, #501).

### 4.3.1
* Fixed support for the Minecraft [Better Compatibility Checker](https://www.curseforge.com/minecraft/mc-mods/better-compatibility-checker) Mod (By @Douile, #436).
* Added a -1 query port offset for Rising World (#441).

### 4.3.0
* Fix `Post Scriptum` not being on the valve protocol.
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
