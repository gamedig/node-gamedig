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

* 7 Days to Die (7d2d)
* Age of Chivalry (ageofchivalry)
* Age of Empires 2 (aoe2)
* Alien Arena (alienarena)
* Alien Swarm (alienswarm)
* ARK: Survival Evolved (arkse)
* Aliens vs Predator 2 (avp2)
* Aliens vs Predator 2010 (avp2010)
* America's Army (americasarmy)
* America's Army 2 (americasarmy2)
* America's Army 3 (americasarmy3)
* America's Army: Proving Grounds (americasarmypg)
* Arca Sim Racing (arcasimracing)
* ArmA (arma)
* ArmA 2 (arma2)
* ArmA 3 (arma3)
* Armagetron (armagetron)
* Baldur's Gate (baldursgate)
* Battalion 1944 (bat1944)
* Battlefield 1942 (bf1942)
* Battlefield Vietnam (bfv)
* Battlefield 2 (bf2)
* Battlefield 2142 (bf2142)
* Battlefield: Bad Company 2 (bfbc2)
* Battlefield 3 (bf3)
* Battlefield 4 (bf4)
* Battlefield Hardline (bfh)
* Breach (breach)
* Breed (breed)
* Brink (brink)
* Build and Shoot (buildandshoot)
* Call of Duty (cod)
* Call of Duty: United Offensive (coduo)
* Call of Duty 2 (cod2)
* Call of Duty 3 (cod3)
* Call of Duty 4: Modern Warfare (cod4)
* Call of Duty: World at War (codwaw)
* Call of Duty: Modern Warfare 2 (codmw2)
* Call of Duty: Modern Warfare 3 (codmw3)
* Call of Juarez (callofjuarez)
* Chaser (chaser)
* Chrome (chrome)
* Codename Eagle (codenameeagle)
* Commandos 3: Destination Berlin (commandos3)
* Command and Conquer: Renegade (cacrenegade)
* Conan Exiles (conanexiles)
* Contact J.A.C.K. (contactjack)
* Counter-Strike 1.6 (cs16)
* Counter-Strike: 2D (cs2d)
* Counter-Strike: Condition Zero (cscz)
* Counter-Strike: Source (css)
* Counter-Strike: Global Offensive (csgo) [[Additional Notes](#csgo)]
* Cross Racing Championship (crossracing)
* Crysis (crysis)
* Crysis Wars (crysiswars)
* Crysis 2 (crysis2)
* Daikatana (daikatana)
* Dark Messiah of Might and Magic (dmomam)
* Darkest Hour (darkesthour)
* DayZ (dayz) [[Additional Notes](#dayz)]
* DayZ Mod (dayzmod)
* Deadly Dozen: Pacific Theater (deadlydozenpt)
* Deer Hunter 2005 (dh2005)
* Descent 3 (descent3)
* Deus Ex (deusex)
* Devastation (devastation)
* Dino D-Day (dinodday)
* Dirt Track Racing 2 (dirttrackracing2)
* Dark and Light (dnl)
* Day of Defeat (dod)
* Day of Defeat: Source (dods)
* Day of Infamy (doi)
* Doom 3 (doom3)
* DOTA 2 (dota2)
* Drakan (drakan)
* Enemy Territory Quake Wars (etqw)
* F.E.A.R. (fear)
* F1 2002 (f12002)
* F1 Challenge 99-02 (f1c9902)
* Far Cry (farcry)
* Far Cry (farcry2)
* Fortress Forever (fortressforever)
* Flashpoint (flashpoint)
* Frontlines: Fuel of War (ffow)
* FiveM (fivem)
* Garry's Mod (garrysmod)
* Ghost Recon: Advanced Warfighter (graw)
* Ghost Recon: Advanced Warfighter 2 (graw2)
* Giants: Citizen Kabuto (giantscitizenkabuto)
* Global Operations (globaloperations)
* Geneshift (geneshift)
* GoldenEye: Source (ges)
* Gore (gore)
* Gunman Chronicles (gunmanchronicles)
* Half-Life 1 Deathmatch (hldm)
* Half-Life 2 Deathmatch (hl2dm)
* Halo (halo)
* Halo 2 (halo2)
* Heretic 2 (heretic2)
* Hexen 2 (hexen2)
* The Hidden: Source (hidden)
* Hidden and Dangerous 2 (had2)
* Homefront (homefront)
* Homeworld 2 (homeworld2)
* Hurtworld (hurtworld)
* IGI-2: Covert Strike (igi2)
* IL-2 Sturmovik (il2)
* Insurgency (insurgency)
* Insurgency: Sandstorm (insurgencysandstorm)
* Iron Storm (ironstorm)
* James Bond: Nightfire (jamesbondnightfire)
* Just Cause 2 Multiplayer (jc2mp)
* Killing Floor (killingfloor)
* Killing Floor 2 (killingfloor2)
* Kingpin: Life of Crime (kingpin)
* KISS Psycho Circus (kisspc)
* DMP - KSP Multiplayer (kspdmp)
* KzMod (kzmod)
* Left 4 Dead (left4dead)
* Left 4 Dead 2 (left4dead2)
* Mafia 2 Multiplayer (m2mp)
* Medieval Engineers (medievalengineers)
* Medal of Honor: Allied Assault (mohaa)
* Medal of Honor: Pacific Assault (mohpa)
* Medal of Honor: Airborne (mohab)
* Medal of Honor: Spearhead (mohsh)
* Medal of Honor: Breakthrough (mohbt)
* Medal of Honor 2010 (moh2010)
* Medal of Honor: Warfighter (mohwf)
* Minecraft (minecraft) [[Additional Notes](#minecraft)]
* Minecraft: Pocket Edition (minecraftpe)
* Monday Night Combat (mnc)
* Multi Theft Auto: Vice City (mtavc)
* Multi Theft Auto: San Andreas (mtasa)
* Mumble (mumble) [[Additional Notes](#mumble)]
* Mumble (mumbleping) [[Additional Notes](#mumble)]
* Mutant Factions (mutantfactions)
* Nascar Thunder 2004 (nascarthunder2004)
* netPanzer (netpanzer)
* No More Room in Hell (nmrih)
* Natural Selection (ns)
* Natural Selection 2 (ns2)
* Need for Speed: Hot Pursuit 2 (nfshp2)
* Nerf Arena Blast (nab)
* Neverwinter Nights (nwn)
* Neverwinter Nights 2 (nwn2)
* Nexuiz (nexuiz)
* Nitro Family (nitrofamily)
* No One Lives Forever (nolf)
* No One Lives Forever 2 (nolf2)
* Nuclear Dawn (nucleardawn)
* OpenArena (openarena)
* OpenTTD (openttd)
* Operation Flashpoint (operationflashpoint)
* Painkiller (painkiller)
* Postal 2 (postal2)
* Prey (prey)
* Primal Carnage: Extinction (primalcarnage)
* Quake 1: QuakeWorld (quake1)
* Quake 2 (quake2)
* Quake 3: Arena (quake3)
* Quake 4 (quake4)
* Rag Doll Kung Fu (ragdollkungfu)
* Rainbow Six (r6)
* Rainbow Six 2: Rogue Spear (r6roguespear)
* Rainbow Six 3: Raven Shield (r6ravenshield)
* RalliSport Challenge (rallisportchallenge)
* Rally Masters (rallymasters)
* Red Orchestra (redorchestra)
* Red Orchestra: Ostfront 41-45 (redorchestraost)
* Red Orchestra 2 (redorchestra2)
* Redline (redline)
* Return to Castle Wolfenstein (rtcw)
* rFactor (rfactor)
* Ricochet (ricochet)
* Rise of Nations (riseofnations)
* Rune (rune)
* Rust (rust)
* San Andreas Multiplayer (samp)
* Space Engineers (spaceengineers)
* Serious Sam (ss)
* Serious Sam 2 (ss2)
* Shattered Horizon (shatteredhorizon)
* The Ship (ship)
* Shogo (shogo)
* Shootmania (shootmania) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* SiN (sin)
* SiN Episodes (sinep)
* Soldat (soldat)
* Soldier of Fortune (sof)
* Soldier of Fortune 2 (sof2)
* S.T.A.L.K.E.R. (stalker)
* Star Trek: Bridge Commander (stbc)
* Star Trek: Voyager - Elite Force (stvef)
* Star Trek: Voyager - Elite Force 2 (stvef2)
* Star Wars: Battlefront (swbf)
* Star Wars: Battlefront 2 (swbf2)
* Star Wars: Jedi Knight (swjk)
* Star Wars: Jedi Knight 2 (swjk2)
* Star Wars: Republic Commando (swrc)
* Starbound (starbound)
* StarMade (starmade)
* Starsiege (2009) (starsiege)
* Suicide Survival (suicidesurvival)
* SWAT 4 (swat4)
* Sven Coop (svencoop)
* Synergy (synergy)
* Tactical Ops (tacticalops)
* Team Factor (teamfactor)
* Team Fortress Classic (tfc)
* Team Fortress 2 (tf2)
* Teamspeak 2 (teamspeak2)
* Teamspeak 3 (teamspeak3) [[Additional Notes](#teamspeak3)]
* Terminus (terminus)
* Terraria (terraria) [[Additional Notes](#terraria)]
* Tony Hawk's Pro Skater 3 (thps3)
* Tony Hawk's Pro Skater 4 (thps4)
* Tony Hawk's Underground 2 (thu2)
* Tower Unite (towerunite)
* Trackmania 2 (trackmania2) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* Trackmania Forever (trackmaniaforever) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* Tremulous (tremulous)
* Tribes 1: Starsiege (tribes1)
* Tribes: Vengeance (tribesvengeance)
* Tron 2.0 (tron20)
* Turok 2 (turok2)
* Universal Combat (universalcombat)
* Unreal (unreal)
* unturned (unturned)
* Unreal Tournament (ut)
* Unreal Tournament 2003 (ut2003)
* Unreal Tournament 2004 (ut2004)
* Unreal Tournament 3 (ut3)
* Urban Terror (urbanterror)
* V8 Supercar Challenge (v8supercar)
* Vice City Multiplayer (vcmp)
* Ventrilo (ventrilo)
* Vietcong (vietcong)
* Vietcong 2 (vietcong2)
* Warsow (warsow)
* Wheel of Time (wheeloftime)
* Wolfenstein 2009 (wolfenstein2009)
* Wolfenstein: Enemy Territory (wolfensteinet)
* Xpand Rally (xpandrally)
* Zombie Master (zombiemaster)
* Zombie Panic: Source (zps)

<!--- END GENERATED GAMES -->

### Not supported (yet)

* Cube Engine (cube):
 * Cube 1
 * Assault Cube
 * Cube 2: Sauerbraten
 * Blood Frontier
* BFRIS
* Call of Duty: Black Ops 1 and 2 (no documentation, may require rcon)
* Counter-Strike 2D
* Freelancer
* Ghost Recon
* GTR2
* Haze
* Hexen 2
* Plain Sight
* Red Faction
* Savage: Battle for Newerth
* Savage 2: A Tortured Soul
* Sum of All Fears
* Teeworlds
* Tribes 2
* World in Conflict

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

### 2.0.10
Added support for rFactor

### 2.0.9
Added support for Vice City: Multiplayer

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
