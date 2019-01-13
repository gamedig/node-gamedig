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
* **bots**: array of objects - Same schema as players
* **raw**: freeform object - Contains all information received from the server in a disorganized format. The content of this
field is unstable, and may change on a per-protocol basis between GameDig patch releases (although not typical).

Games List
---

### Supported
<!--- BEGIN GENERATED GAMES -->

* 7 Days to Die (7d2d) [[Separate Query Port](#separate-query-port)]
* Age of Chivalry (ageofchivalry)
* Age of Empires 2 (aoe2) [[Separate Query Port](#separate-query-port)]
* Alien Arena (alienarena) [[Separate Query Port](#separate-query-port)]
* Alien Swarm (alienswarm)
* ARK: Survival Evolved (arkse) [[Separate Query Port](#separate-query-port)]
* Aliens vs Predator 2 (avp2)
* Aliens vs Predator 2010 (avp2010)
* America's Army (americasarmy) [[Separate Query Port](#separate-query-port)]
* America's Army 2 (americasarmy2) [[Separate Query Port](#separate-query-port)]
* America's Army 3 (americasarmy3) [[Separate Query Port](#separate-query-port)]
* America's Army: Proving Grounds (americasarmypg) [[Separate Query Port](#separate-query-port)]
* ArmA (arma)
* ArmA 2 (arma2) [[Separate Query Port](#separate-query-port)]
* ArmA 3 (arma3) [[Separate Query Port](#separate-query-port)]
* Armagetron (armagetron)
* Baldur's Gate (baldursgate) [[Separate Query Port](#separate-query-port)]
* Battalion 1944 (bat1944) [[Separate Query Port](#separate-query-port)]
* Battlefield 1942 (bf1942) [[Separate Query Port](#separate-query-port)]
* Battlefield Vietnam (bfv) [[Separate Query Port](#separate-query-port)]
* Battlefield 2 (bf2) [[Separate Query Port](#separate-query-port)]
* Battlefield 2142 (bf2142) [[Separate Query Port](#separate-query-port)]
* Battlefield: Bad Company 2 (bfbc2) [[Separate Query Port](#separate-query-port)]
* Battlefield 3 (bf3) [[Separate Query Port](#separate-query-port)]
* Battlefield 4 (bf4) [[Separate Query Port](#separate-query-port)]
* Battlefield Hardline (bfh) [[Separate Query Port](#separate-query-port)]
* Breach (breach)
* Breed (breed)
* Brink (brink) [[Separate Query Port](#separate-query-port)]
* Build and Shoot (buildandshoot) [[Separate Query Port](#separate-query-port)]
* Call of Duty (cod)
* Call of Duty: United Offensive (coduo)
* Call of Duty 2 (cod2)
* Call of Duty 3 (cod3)
* Call of Duty 4: Modern Warfare (cod4)
* Call of Duty: World at War (codwaw)
* Call of Duty: Modern Warfare 2 (codmw2)
* Call of Duty: Modern Warfare 3 (codmw3) [[Separate Query Port](#separate-query-port)]
* Call of Juarez (callofjuarez) [[Separate Query Port](#separate-query-port)]
* Chaser (chaser) [[Separate Query Port](#separate-query-port)]
* Chrome (chrome) [[Separate Query Port](#separate-query-port)]
* Codename Eagle (codenameeagle) [[Separate Query Port](#separate-query-port)]
* Commandos 3: Destination Berlin (commandos3) [[Separate Query Port](#separate-query-port)]
* Command and Conquer: Renegade (cacrenegade) [[Separate Query Port](#separate-query-port)]
* Conan Exiles (conanexiles) [[Separate Query Port](#separate-query-port)]
* Contact J.A.C.K. (contactjack) [[Separate Query Port](#separate-query-port)]
* Counter-Strike 1.6 (cs16)
* Counter-Strike: Condition Zero (cscz)
* Counter-Strike: Source (css)
* Counter-Strike: Global Offensive (csgo) [[Additional Notes](#csgo)]
* Cross Racing Championship (crossracing) [[Separate Query Port](#separate-query-port)]
* Crysis (crysis)
* Crysis Wars (crysiswars)
* Crysis 2 (crysis2)
* Daikatana (daikatana) [[Separate Query Port](#separate-query-port)]
* Dark Messiah of Might and Magic (dmomam)
* Darkest Hour (darkesthour) [[Separate Query Port](#separate-query-port)]
* DayZ (dayz) [[Separate Query Port](#separate-query-port)] [[Additional Notes](#dayz)]
* DayZ Mod (dayzmod) [[Separate Query Port](#separate-query-port)]
* Deadly Dozen: Pacific Theater (deadlydozenpt) [[Separate Query Port](#separate-query-port)]
* Deer Hunter 2005 (dh2005) [[Separate Query Port](#separate-query-port)]
* Descent 3 (descent3) [[Separate Query Port](#separate-query-port)]
* Deus Ex (deusex) [[Separate Query Port](#separate-query-port)]
* Devastation (devastation) [[Separate Query Port](#separate-query-port)]
* Dino D-Day (dinodday)
* Dirt Track Racing 2 (dirttrackracing2) [[Separate Query Port](#separate-query-port)]
* Dark and Light (dnl) [[Separate Query Port](#separate-query-port)]
* Day of Defeat (dod)
* Day of Defeat: Source (dods)
* Day of Infamy (doi)
* Doom 3 (doom3)
* DOTA 2 (dota2)
* Drakan (drakan) [[Separate Query Port](#separate-query-port)]
* Enemy Territory Quake Wars (etqw) [[Separate Query Port](#separate-query-port)]
* F.E.A.R. (fear) [[Separate Query Port](#separate-query-port)]
* F1 2002 (f12002) [[Separate Query Port](#separate-query-port)]
* F1 Challenge 99-02 (f1c9902) [[Separate Query Port](#separate-query-port)]
* Far Cry (farcry) [[Separate Query Port](#separate-query-port)]
* Far Cry (farcry2) [[Separate Query Port](#separate-query-port)]
* Fortress Forever (fortressforever)
* Flashpoint (flashpoint) [[Separate Query Port](#separate-query-port)]
* Frontlines: Fuel of War (ffow) [[Separate Query Port](#separate-query-port)]
* FiveM (fivem)
* Garry's Mod (garrysmod)
* Ghost Recon: Advanced Warfighter (graw) [[Separate Query Port](#separate-query-port)]
* Ghost Recon: Advanced Warfighter 2 (graw2) [[Separate Query Port](#separate-query-port)]
* Giants: Citizen Kabuto (giantscitizenkabuto) [[Separate Query Port](#separate-query-port)]
* Global Operations (globaloperations) [[Separate Query Port](#separate-query-port)]
* Geneshift (geneshift)
* GoldenEye: Source (ges)
* Gore (gore) [[Separate Query Port](#separate-query-port)]
* Gunman Chronicles (gunmanchronicles)
* Half-Life 1 Deathmatch (hldm)
* Half-Life 2 Deathmatch (hl2dm)
* Halo (halo)
* Halo 2 (halo2)
* Heretic 2 (heretic2) [[Separate Query Port](#separate-query-port)]
* Hexen 2 (hexen2) [[Separate Query Port](#separate-query-port)]
* The Hidden: Source (hidden)
* Hidden and Dangerous 2 (had2) [[Separate Query Port](#separate-query-port)]
* Homefront (homefront)
* Homeworld 2 (homeworld2) [[Separate Query Port](#separate-query-port)]
* Hurtworld (hurtworld) [[Separate Query Port](#separate-query-port)]
* IGI-2: Covert Strike (igi2) [[Separate Query Port](#separate-query-port)]
* IL-2 Sturmovik (il2) [[Separate Query Port](#separate-query-port)]
* Insurgency (insurgency)
* Iron Storm (ironstorm) [[Separate Query Port](#separate-query-port)]
* James Bond: Nightfire (jamesbondnightfire) [[Separate Query Port](#separate-query-port)]
* Just Cause 2 Multiplayer (jc2mp)
* Killing Floor (killingfloor) [[Separate Query Port](#separate-query-port)]
* Killing Floor 2 (killingfloor2) [[Separate Query Port](#separate-query-port)]
* Kingpin: Life of Crime (kingpin) [[Separate Query Port](#separate-query-port)]
* KISS Psycho Circus (kisspc) [[Separate Query Port](#separate-query-port)]
* DMP - KSP Multiplayer (kspdmp) [[Separate Query Port](#separate-query-port)]
* KzMod (kzmod)
* Left 4 Dead (left4dead)
* Left 4 Dead 2 (left4dead2)
* Mafia 2 Multiplayer (m2mp) [[Separate Query Port](#separate-query-port)]
* Medieval Engineers (medievalengineers)
* Medal of Honor: Allied Assault (mohaa) [[Separate Query Port](#separate-query-port)]
* Medal of Honor: Pacific Assault (mohpa) [[Separate Query Port](#separate-query-port)]
* Medal of Honor: Airborne (mohab) [[Separate Query Port](#separate-query-port)]
* Medal of Honor: Spearhead (mohsh) [[Separate Query Port](#separate-query-port)]
* Medal of Honor: Breakthrough (mohbt) [[Separate Query Port](#separate-query-port)]
* Medal of Honor 2010 (moh2010) [[Separate Query Port](#separate-query-port)]
* Medal of Honor: Warfighter (mohwf) [[Separate Query Port](#separate-query-port)]
* Minecraft (minecraft) [[Additional Notes](#minecraft)]
* Minecraft: Pocket Edition (minecraftpe)
* Monday Night Combat (mnc) [[Separate Query Port](#separate-query-port)]
* Multi Theft Auto: Vice City (mtavc) [[Separate Query Port](#separate-query-port)]
* Multi Theft Auto: San Andreas (mtasa) [[Separate Query Port](#separate-query-port)]
* Mumble (mumble) [[Separate Query Port](#separate-query-port)] [[Additional Notes](#mumble)]
* Mumble (mumbleping) [[Additional Notes](#mumble)]
* Mutant Factions (mutantfactions)
* Nascar Thunder 2004 (nascarthunder2004) [[Separate Query Port](#separate-query-port)]
* netPanzer (netpanzer)
* No More Room in Hell (nmrih)
* Natural Selection (ns)
* Natural Selection 2 (ns2) [[Separate Query Port](#separate-query-port)]
* Need for Speed: Hot Pursuit 2 (nfshp2) [[Separate Query Port](#separate-query-port)]
* Nerf Arena Blast (nab) [[Separate Query Port](#separate-query-port)]
* Neverwinter Nights (nwn) [[Separate Query Port](#separate-query-port)]
* Neverwinter Nights 2 (nwn2) [[Separate Query Port](#separate-query-port)]
* Nexuiz (nexuiz) [[Separate Query Port](#separate-query-port)]
* Nitro Family (nitrofamily) [[Separate Query Port](#separate-query-port)]
* No One Lives Forever (nolf) [[Separate Query Port](#separate-query-port)]
* No One Lives Forever 2 (nolf2) [[Separate Query Port](#separate-query-port)]
* Nuclear Dawn (nucleardawn)
* OpenArena (openarena) [[Separate Query Port](#separate-query-port)]
* OpenTTD (openttd)
* Operation Flashpoint (operationflashpoint) [[Separate Query Port](#separate-query-port)]
* Painkiller (painkiller) [[Separate Query Port](#separate-query-port)]
* Postal 2 (postal2) [[Separate Query Port](#separate-query-port)]
* Prey (prey) [[Separate Query Port](#separate-query-port)]
* Primal Carnage: Extinction (primalcarnage) [[Separate Query Port](#separate-query-port)]
* Quake 1: QuakeWorld (quake1)
* Quake 2 (quake2)
* Quake 3: Arena (quake3)
* Quake 4 (quake4)
* Rag Doll Kung Fu (ragdollkungfu)
* Rainbow Six (r6) [[Separate Query Port](#separate-query-port)]
* Rainbow Six 2: Rogue Spear (r6roguespear) [[Separate Query Port](#separate-query-port)]
* Rainbow Six 3: Raven Shield (r6ravenshield) [[Separate Query Port](#separate-query-port)]
* RalliSport Challenge (rallisportchallenge) [[Separate Query Port](#separate-query-port)]
* Rally Masters (rallymasters) [[Separate Query Port](#separate-query-port)]
* Red Orchestra (redorchestra) [[Separate Query Port](#separate-query-port)]
* Red Orchestra: Ostfront 41-45 (redorchestraost) [[Separate Query Port](#separate-query-port)]
* Red Orchestra 2 (redorchestra2) [[Separate Query Port](#separate-query-port)]
* Redline (redline) [[Separate Query Port](#separate-query-port)]
* Return to Castle Wolfenstein (rtcw) [[Separate Query Port](#separate-query-port)]
* Ricochet (ricochet)
* Rise of Nations (riseofnations) [[Separate Query Port](#separate-query-port)]
* Rune (rune) [[Separate Query Port](#separate-query-port)]
* Rust (rust)
* San Andreas Multiplayer (samp)
* Space Engineers (spaceengineers)
* Serious Sam (ss) [[Separate Query Port](#separate-query-port)]
* Serious Sam 2 (ss2)
* Shattered Horizon (shatteredhorizon)
* The Ship (ship)
* Shogo (shogo) [[Separate Query Port](#separate-query-port)]
* Shootmania (shootmania) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* SiN (sin) [[Separate Query Port](#separate-query-port)]
* SiN Episodes (sinep)
* Soldat (soldat) [[Separate Query Port](#separate-query-port)]
* Soldier of Fortune (sof) [[Separate Query Port](#separate-query-port)]
* Soldier of Fortune 2 (sof2) [[Separate Query Port](#separate-query-port)]
* S.T.A.L.K.E.R. (stalker) [[Separate Query Port](#separate-query-port)]
* Star Trek: Bridge Commander (stbc) [[Separate Query Port](#separate-query-port)]
* Star Trek: Voyager - Elite Force (stvef) [[Separate Query Port](#separate-query-port)]
* Star Trek: Voyager - Elite Force 2 (stvef2) [[Separate Query Port](#separate-query-port)]
* Star Wars: Battlefront (swbf) [[Separate Query Port](#separate-query-port)]
* Star Wars: Battlefront 2 (swbf2) [[Separate Query Port](#separate-query-port)]
* Star Wars: Jedi Knight (swjk) [[Separate Query Port](#separate-query-port)]
* Star Wars: Jedi Knight 2 (swjk2) [[Separate Query Port](#separate-query-port)]
* Star Wars: Republic Commando (swrc) [[Separate Query Port](#separate-query-port)]
* Starbound (starbound)
* StarMade (starmade)
* Suicide Survival (suicidesurvival)
* SWAT 4 (swat4) [[Separate Query Port](#separate-query-port)]
* Sven Coop (svencoop)
* Synergy (synergy)
* Tactical Ops (tacticalops) [[Separate Query Port](#separate-query-port)]
* Team Factor (teamfactor) [[Separate Query Port](#separate-query-port)]
* Team Fortress Classic (tfc)
* Team Fortress 2 (tf2)
* Teamspeak 2 (teamspeak2) [[Separate Query Port](#separate-query-port)]
* Teamspeak 3 (teamspeak3) [[Separate Query Port](#separate-query-port)] [[Additional Notes](#teamspeak3)]
* Terminus (terminus) [[Separate Query Port](#separate-query-port)]
* Terraria (terraria) [[Separate Query Port](#separate-query-port)] [[Additional Notes](#terraria)]
* Tony Hawk's Pro Skater 3 (thps3) [[Separate Query Port](#separate-query-port)]
* Tony Hawk's Pro Skater 4 (thps4) [[Separate Query Port](#separate-query-port)]
* Tony Hawk's Underground 2 (thu2) [[Separate Query Port](#separate-query-port)]
* Tower Unite (towerunite)
* Trackmania 2 (trackmania2) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* Trackmania Forever (trackmaniaforever) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* Tremulous (tremulous) [[Separate Query Port](#separate-query-port)]
* Tribes 1: Starsiege (tribes1)
* Tribes: Vengeance (tribesvengeance) [[Separate Query Port](#separate-query-port)]
* Tron 2.0 (tron20) [[Separate Query Port](#separate-query-port)]
* Turok 2 (turok2) [[Separate Query Port](#separate-query-port)]
* Universal Combat (universalcombat) [[Separate Query Port](#separate-query-port)]
* Unreal (unreal) [[Separate Query Port](#separate-query-port)]
* unturned (unturned) [[Separate Query Port](#separate-query-port)]
* Unreal Tournament (ut) [[Separate Query Port](#separate-query-port)]
* Unreal Tournament 2003 (ut2003) [[Separate Query Port](#separate-query-port)]
* Unreal Tournament 2004 (ut2004) [[Separate Query Port](#separate-query-port)]
* Unreal Tournament 3 (ut3) [[Separate Query Port](#separate-query-port)]
* Urban Terror (urbanterror) [[Separate Query Port](#separate-query-port)]
* V8 Supercar Challenge (v8supercar) [[Separate Query Port](#separate-query-port)]
* Ventrilo (ventrilo)
* Vietcong (vietcong) [[Separate Query Port](#separate-query-port)]
* Vietcong 2 (vietcong2) [[Separate Query Port](#separate-query-port)]
* Warsow (warsow)
* Wheel of Time (wheeloftime) [[Separate Query Port](#separate-query-port)]
* Wolfenstein 2009 (wolfenstein2009) [[Separate Query Port](#separate-query-port)]
* Wolfenstein: Enemy Territory (wolfensteinet) [[Separate Query Port](#separate-query-port)]
* Xpand Rally (xpandrally) [[Separate Query Port](#separate-query-port)]
* Zombie Master (zombiemaster)
* Zombie Panic: Source (zps)

<!--- END GENERATED GAMES -->

### Not supported (yet)

* rFactor Engine (rfactor):
 * rFactor
 * Arca Sim Racing
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
* Vice City Multiplayer
* World in Conflict

> Want support for one of these games? Please open an issue to show your interest!
> __Know how to code?__ Protocols for most of the games above are documented
> in the /reference folder, ready for you to develop into GameDig!

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

### Separate Query Port
Games with this note use a query port which is usually not the same as the game's connection port.
Usually, no action will be required from you. The 'port' option you pass GameDig should be the game's
connection port. GameDig will attempt to calculate the query port automatically. If the query still fails,
you may need to find your server's query port, and pass that to GameDig instead.

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

### 2.0

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

### 1.0
* First official release
* Node.js 6 is now required
