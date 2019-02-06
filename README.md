node-GameDig - Game Server Query Library
---
node-GameDig is a game server query library, capable of querying for the status of
nearly any game or voice server. If a server makes its status publically available,
GameDig can fetch it for you.

GameDig is available as a node.js module, as well as a
[command line executable](#usage-from-command-line).

Usage from Node.js
---

```shell
npm install gamedig
```

```javascript
const Gamedig = require('gamedig');
Gamedig.query({
    type: 'minecraft',
    host: 'mc.example.com'
}).then((state) => {
    console.log(state);
}).catch((error) => {
    console.log("Server is offline");
});
```

### Query Options

**Typical**

* **type**: string - One of the game IDs listed in the game list below
* **host**: string - Hostname or IP of the game server
* **port**: number (optional) - Connection port or query port for the game server. Some
games utilize a separate "query" port. If specifying the game port does not seem to work as expected, passing in
this query port may work instead. (defaults to protocol default port)

**Advanced**

* **maxAttempts**: number - Number of attempts to query server in case of failure. (default 1)
* **socketTimeout**: number - Milliseconds to wait for a single packet. Beware that increasing this
 will cause many queries to take longer even if the server is online. (default 2000)
* **attemptTimeout**: number - Milliseconds allowed for an entire query attempt. This timeout is not commonly hit,
 as the socketTimeout typically fires first. (default 10000)
* **debug**: boolean - Enables massive amounts of debug logging to stdout. (default false)

### Return Value

The returned state object will contain the following keys:

* **name**: string - Server name
* **map**: string - Current server game map
* **password**: boolean - If a password is required
* **maxplayers**: number
* **players**: array of objects
  * Each object **may or may not** contain name, ping, score, team, address.
  * The number of players online can be determined by `players.length`.
  * For servers which do not provide player names, this may be an array
of empty objects (ex. `[{},{},{}]`), one for each player without a name.
* **bots**: array of objects - Same schema as `players`
* **connect**: string
  * This will typically include the game's `ip:port`
  * The port will reflect the server's game port, even if your request specified the game's query port in the request.
  * For some games, this may be a server ID or connection url if an IP:Port is not appropriate for end-users.
* **ping**: number
  * Round trip time to the server (in milliseconds).
  * Note that this is not the RTT of an ICMP echo, as ICMP packets are often blocked by NATs and node
    has poor support for raw sockets.
  * This value is derived from the RTT of one of the query packets, which is usually quite accurate, but may add a bit due to server lag.
* **raw**: freeform object (unstable)
  * Contains all information received from the server in a disorganized format.
  * The content of this field MAY change on a per-protocol basis between GameDig patch releases (although not typical).

Games List
---

### Supported
<!--- BEGIN GENERATED GAMES -->

| Type ID | Name | Notes
|---|---|---
| `7d2d`     | 7 Days to Die (2013)
| `ageofchivalry` | Age of Chivalry (2007)
| `aoe2`     | Age of Empires 2 (1999)
| `alienarena` | Alien Arena (2004)
| `alienswarm` | Alien Swarm (2010)
| `arkse`    | Ark: Survival Evolved (2017)
| `atlas`    | Atlas (2018)
| `avp2`     | Aliens versus Predator 2 (2001)
| `avp2010`  | Aliens vs. Predator (2010)
| `americasarmy` | America's Army (2002)
| `americasarmy2` | America's Army 2 (2003)
| `americasarmy3` | America's Army 3 (2009)
| `americasarmypg` | America's Army: Proving Grounds (2015)
| `arcasimracing` | Arca Sim Racing (2008)
| `arma`     | ARMA: Armed Assault (2007)
| `arma2`    | ARMA 2 (2009)
| `arma3`    | ARMA 3 (2013)
| `armagetron` | Armagetron Advanced (2001)
| `baldursgate` | Baldur's Gate (1998)
| `bat1944`  | Battalion 1944 (2018)
| `bf1942`   | Battlefield 1942 (2002)
| `bfv`      | Battlefield Vietnam (2004)
| `bf2`      | Battlefield 2 (2005)
| `bf2142`   | Battlefield 2142 (2006)
| `bfbc2`    | Battlefield: Bad Company 2 (2010)
| `bf3`      | Battlefield 3 (2011)
| `bf4`      | Battlefield 4 (2013)
| `bfh`      | Battlefield Hardline (2015)
| `breach`   | Breach (2011)
| `breed`    | Breed (2004)
| `brink`    | Brink (2011)
| `buildandshoot` | Build and Shoot / Ace of Spades Classic (2012)
| `cod`      | Call of Duty (2003)
| `coduo`    | Call of Duty: United Offensive (2004)
| `cod2`     | Call of Duty 2 (2005)
| `cod3`     | Call of Duty 3 (2006)
| `cod4`     | Call of Duty 4: Modern Warfare (2007)
| `codwaw`   | Call of Duty: World at War (2008)
| `codmw2`   | Call of Duty: Modern Warfare 2 (2009)
| `codmw3`   | Call of Duty: Modern Warfare 3 (2011)
| `callofjuarez` | Call of Juarez
| `chaser`   | Chaser
| `chrome`   | Chrome
| `codenameeagle` | Codename Eagle
| `commandos3` | Commandos 3: Destination Berlin
| `cacrenegade` | Command and Conquer: Renegade
| `conanexiles` | Conan Exiles
| `contactjack` | Contract J.A.C.K.
| `cs15`     | Counter-Strike 1.5
| `cs16`     | Counter-Strike 1.6
| `cs2d`     | Counter-Strike: 2D
| `cscz`     | Counter-Strike: Condition Zero
| `css`      | Counter-Strike: Source
| `csgo`     | Counter-Strike: Global Offensive | [Notes](#csgo)
| `crossracing` | Cross Racing Championship
| `crysis`   | Crysis
| `crysiswars` | Crysis Wars
| `crysis2`  | Crysis 2
| `daikatana` | Daikatana
| `dmomam`   | Dark Messiah of Might and Magic
| `darkesthour` | Darkest Hour
| `dayz`     | DayZ | [Notes](#dayz)
| `dayzmod`  | DayZ Mod
| `deadlydozenpt` | Deadly Dozen: Pacific Theater
| `dh2005`   | Deer Hunter 2005
| `descent3` | Descent 3
| `deusex`   | Deus Ex
| `devastation` | Devastation
| `dinodday` | Dino D-Day
| `dirttrackracing2` | Dirt Track Racing 2
| `dnl`      | Dark and Light
| `dod`      | Day of Defeat
| `dods`     | Day of Defeat: Source
| `doi`      | Day of Infamy
| `doom3`    | Doom 3
| `dota2`    | DOTA 2
| `drakan`   | Drakan
| `etqw`     | Enemy Territory Quake Wars
| `fear`     | F.E.A.R.
| `f12002`   | F1 2002
| `f1c9902`  | F1 Challenge 99-02
| `farcry`   | Far Cry
| `farcry2`  | Far Cry
| `fortressforever` | Fortress Forever
| `flashpoint` | Flashpoint
| `ffow`     | Frontlines: Fuel of War
| `fivem`    | FiveM
| `garrysmod` | Garry's Mod
| `graw`     | Ghost Recon: Advanced Warfighter
| `graw2`    | Ghost Recon: Advanced Warfighter 2
| `giantscitizenkabuto` | Giants: Citizen Kabuto
| `globaloperations` | Global Operations
| `geneshift` | Geneshift
| `ges`      | GoldenEye: Source
| `gore`     | Gore
| `gunmanchronicles` | Gunman Chronicles
| `hldm`     | Half-Life 1 Deathmatch
| `hl2dm`    | Half-Life 2 Deathmatch
| `halo`     | Halo
| `halo2`    | Halo 2
| `heretic2` | Heretic 2
| `hexen2`   | Hexen 2
| `hidden`   | The Hidden: Source
| `had2`     | Hidden and Dangerous 2
| `homefront` | Homefront
| `homeworld2` | Homeworld 2
| `hurtworld` | Hurtworld
| `igi2`     | IGI-2: Covert Strike
| `il2`      | IL-2 Sturmovik
| `insurgency` | Insurgency
| `insurgencysandstorm` | Insurgency: Sandstorm
| `ironstorm` | Iron Storm
| `jamesbondnightfire` | James Bond: Nightfire
| `jc2mp`    | Just Cause 2 Multiplayer
| `killingfloor` | Killing Floor
| `killingfloor2` | Killing Floor 2
| `kingpin`  | Kingpin: Life of Crime
| `kisspc`   | KISS Psycho Circus
| `kspdmp`   | DMP - KSP Multiplayer
| `kzmod`    | KzMod
| `left4dead` | Left 4 Dead
| `left4dead2` | Left 4 Dead 2
| `m2mp`     | Mafia 2 Multiplayer
| `m2o`      | Mafia 2 Online
| `medievalengineers` | Medieval Engineers
| `mohaa`    | Medal of Honor: Allied Assault
| `mohpa`    | Medal of Honor: Pacific Assault
| `mohab`    | Medal of Honor: Airborne
| `mohsh`    | Medal of Honor: Spearhead
| `mohbt`    | Medal of Honor: Breakthrough
| `moh2010`  | Medal of Honor 2010
| `mohwf`    | Medal of Honor: Warfighter
| `minecraft` | Minecraft | [Notes](#minecraft)
| `minecraftpe` | Minecraft: Pocket Edition
| `mnc`      | Monday Night Combat
| `mtavc`    | Multi Theft Auto: Vice City
| `mtasa`    | Multi Theft Auto: San Andreas
| `mumble`   | Mumble (Requires GTmurmur plugin) | [Notes](#mumble)
| `mumbleping` | Mumble (Lightweight) | [Notes](#mumble)
| `mutantfactions` | Mutant Factions
| `nascarthunder2004` | Nascar Thunder 2004
| `netpanzer` | netPanzer
| `nmrih`    | No More Room in Hell
| `ns`       | Natural Selection
| `ns2`      | Natural Selection 2
| `nfshp2`   | Need for Speed: Hot Pursuit 2
| `nab`      | Nerf Arena Blast
| `nwn`      | Neverwinter Nights
| `nwn2`     | Neverwinter Nights 2
| `nexuiz`   | Nexuiz
| `nitrofamily` | Nitro Family
| `nolf`     | No One Lives Forever
| `nolf2`    | No One Lives Forever 2
| `nucleardawn` | Nuclear Dawn
| `openarena` | OpenArena
| `openttd`  | OpenTTD
| `operationflashpoint` | Operation Flashpoint
| `painkiller` | Painkiller
| `postal2`  | Postal 2
| `prey`     | Prey
| `primalcarnage` | Primal Carnage: Extinction
| `quake1`   | Quake 1: QuakeWorld
| `quake2`   | Quake 2
| `quake3`   | Quake 3: Arena
| `quake4`   | Quake 4
| `ragdollkungfu` | Rag Doll Kung Fu
| `r6`       | Rainbow Six
| `r6roguespear` | Rainbow Six 2: Rogue Spear
| `r6ravenshield` | Rainbow Six 3: Raven Shield
| `rallisportchallenge` | RalliSport Challenge
| `rallymasters` | Rally Masters
| `redorchestra` | Red Orchestra
| `redorchestraost` | Red Orchestra: Ostfront 41-45
| `redorchestra2` | Red Orchestra 2
| `redline`  | Redline
| `rtcw`     | Return to Castle Wolfenstein
| `rfactor`  | rFactor
| `ricochet` | Ricochet
| `riseofnations` | Rise of Nations
| `rune`     | Rune
| `rust`     | Rust
| `samp`     | San Andreas Multiplayer
| `spaceengineers` | Space Engineers
| `ss`       | Serious Sam
| `ss2`      | Serious Sam 2
| `shatteredhorizon` | Shattered Horizon
| `ship`     | The Ship
| `shogo`    | Shogo
| `shootmania` | Shootmania | [Notes](#nadeo-shootmania--trackmania--etc)
| `sin`      | SiN
| `sinep`    | SiN Episodes
| `soldat`   | Soldat
| `sof`      | Soldier of Fortune
| `sof2`     | Soldier of Fortune 2
| `stalker`  | S.T.A.L.K.E.R.
| `stbc`     | Star Trek: Bridge Commander
| `stvef`    | Star Trek: Voyager - Elite Force
| `stvef2`   | Star Trek: Voyager - Elite Force 2
| `swbf`     | Star Wars: Battlefront
| `swbf2`    | Star Wars: Battlefront 2
| `swjk`     | Star Wars: Jedi Knight
| `swjk2`    | Star Wars: Jedi Knight 2
| `swrc`     | Star Wars: Republic Commando
| `starbound` | Starbound
| `starmade` | StarMade
| `starsiege` | Starsiege (2009)
| `suicidesurvival` | Suicide Survival
| `swat4`    | SWAT 4
| `svencoop` | Sven Coop
| `synergy`  | Synergy
| `tacticalops` | Tactical Ops
| `teamfactor` | Team Factor
| `tfc`      | Team Fortress Classic
| `tf2`      | Team Fortress 2
| `teamspeak2` | Teamspeak 2
| `teamspeak3` | Teamspeak 3 | [Notes](#teamspeak3)
| `terminus` | Terminus
| `terraria` | Terraria | [Notes](#terraria)
| `thps3`    | Tony Hawk's Pro Skater 3
| `thps4`    | Tony Hawk's Pro Skater 4
| `thu2`     | Tony Hawk's Underground 2
| `towerunite` | Tower Unite
| `trackmania2` | Trackmania 2 | [Notes](#nadeo-shootmania--trackmania--etc)
| `trackmaniaforever` | Trackmania Forever | [Notes](#nadeo-shootmania--trackmania--etc)
| `tremulous` | Tremulous
| `tribes1`  | Tribes 1: Starsiege
| `tribesvengeance` | Tribes: Vengeance
| `tron20`   | Tron 2.0
| `turok2`   | Turok 2
| `universalcombat` | Universal Combat
| `unreal`   | Unreal
| `unturned` | unturned
| `ut`       | Unreal Tournament
| `ut2003`   | Unreal Tournament 2003
| `ut2004`   | Unreal Tournament 2004
| `ut3`      | Unreal Tournament 3
| `urbanterror` | Urban Terror
| `v8supercar` | V8 Supercar Challenge
| `vcmp`     | Vice City Multiplayer
| `ventrilo` | Ventrilo
| `vietcong` | Vietcong
| `vietcong2` | Vietcong 2
| `warsow`   | Warsow
| `wheeloftime` | Wheel of Time
| `wolfenstein2009` | Wolfenstein 2009
| `wolfensteinet` | Wolfenstein: Enemy Territory
| `xpandrally` | Xpand Rally
| `zombiemaster` | Zombie Master
| `zps`      | Zombie Panic: Source

<!--- END GENERATED GAMES -->

### Not supported (yet)

* Cube Engine (cube):
  * Cube 1
  * Assault Cube
  * Cube 2: Sauerbraten
  * Blood Frontier
* Alien vs Predator
* Armed Assault 2: Operation Arrowhead
* Battlefield Bad Company 2: Vietnam
* BFRIS
* Call of Duty: Black Ops 1 and 2 (no documentation, may require rcon)
* Crysis Warhead
* Days of War
* DirtyBomb
* Doom - Skulltag
* Doom - ZDaemon
* ECO Global Survival
* Empyrion - Galactic Survival
* Farming Simulator
* Freelancer
* Ghost Recon
* GRAV Online
* GTA Network
* GTR 2
* Haze
* Hexen World
* Just Cause 3 Multiplayer
* Lost Heaven
* Multi Theft Auto
* Pariah
* Plain Sight
* Project Reality: Battlefield 2
* Purge Jihad
* Quake Live
* Red Eclipse
* Red Faction
* Rising Storm 2
* S.T.A.L.K.E.R. Clear Sky
* Savage: The Battle For Newerth
* Savage 2: A Tortured Soul
* SiN 1 Multiplayer
* South Park
* Squad
* Star Wars Jedi Knight: Dark Forces II
* Star Wars: X-Wing Alliance
* Sum of All Fears
* Teeworlds
* The Forrest
* Tibia
* Titanfall
* Tribes 2
* Unreal 2 XMP
* World in Conflict
* World Opponent Network
* Wurm Unlimited

> Want support for one of these games? Please open an issue to show your interest!
> __Know how to code?__ Protocol details for many of the games above are documented
> at https://github.com/sonicsnes/legacy-query-library-archive
> , ready for you to develop into GameDig!

> Don't see your game listed here?
>
> First, let us know so we can fix it. Then, you can try using some common query
> protocols directly by using one of these server types:
> * protocol-ase
> * protocol-battlefield
> * protocol-doom3
> * protocol-gamespy1
> * protocol-gamespy2
> * protocol-gamespy3
> * protocol-nadeo
> * protocol-quake2
> * protocol-quake3
> * protocol-unreal2
> * protocol-valve

Games with Additional Notes
---

### <a name="csgo"></a>Counter-Strike: Global Offensive
To receive a full player list response from CS:GO servers, the server must
have set the cvar: host_players_show 2

### DayZ
DayZ uses a query port that is separate from its main game port. The query port is usually
the game port PLUS 24714 or 24715. You may need to pass this query port into GameDig instead.

### Mumble
For full query results from Mumble, you must be running the
[GTmurmur plugin](http://www.gametracker.com/downloads/gtmurmurplugin.php).
If you do not wish to run the plugin, or do not require details such as channel and user lists,
you can use the 'mumbleping' server type instead, which uses a less accurate but more reliable solution

### Nadeo (ShootMania / TrackMania / etc)
The server must have xmlrpc enabled, and you must pass the xmlrpc port to GameDig, not the connection port.
You must have a user account on the server with access level User or higher.
Pass the login into to GameDig with the additional options: login, password

### <a name="teamspeak3"></a>TeamSpeak 3
For teamspeak 3 queries to work correctly, the following permissions must be available for the guest server group:

* Virtual Server
 * b_virtualserver_info_view
 * b_virtualserver_channel_list
 * b_virtualserver_client_list
* Group
 * b_virtualserver_servergroup_list
 * b_virtualserver_channelgroup_list

### Terraria
Requires tshock server mod, and a REST user token, which can be passed to GameDig with the
additional option: token

Usage from Command Line
---

Want to integrate server queries from a batch script or other programming language?
You'll still need npm to install gamedig:
```shell
npm install gamedig -g
```

After installing gamedig globally, you can call gamedig via the command line:
```shell
gamedig --type minecraft mc.example.com:11234
```

The output of the command will be in JSON format. Additional advanced parameters can be passed in
as well: `--debug`, `--pretty`, `--socketTimeout 5000`, etc.

Changelog
---

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
