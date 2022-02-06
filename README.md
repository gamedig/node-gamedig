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
* **givenPortOnly**: boolean - Only attempt to query server on given port. (default false)
* **debug**: boolean - Enables massive amounts of debug logging to stdout. (default false)
* **requestRules**: boolean - Valve games only. Additional 'rules' may be fetched into the `raw` field. (default false)

### Return Value

The returned state object will contain the following keys:

* **name**: string - Server name
* **map**: string - Current server game map
* **password**: boolean - If a password is required
* **maxplayers**: number
* **players**: array of objects
  * **name**: string - If the player's name is unknown, the string will be empty.
  * **raw**: object - Additional information about the player if available (unstable)
    * The content of this field MAY change on a per-protocol basis between GameDig patch releases (although not typical).
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

| GameDig Type ID | Name | See Also
|---|---|---
| `7d2d`     | 7 Days to Die (2013) | [Valve Protocol](#valve)
| `ageofchivalry` | Age of Chivalry (2007) | [Valve Protocol](#valve)
| `aoe2`     | Age of Empires 2 (1999)
| `alienarena` | Alien Arena (2004)
| `alienswarm` | Alien Swarm (2010) | [Valve Protocol](#valve)
| `avp2`     | Aliens versus Predator 2 (2001)
| `avp2010`  | Aliens vs. Predator (2010) | [Valve Protocol](#valve)
| `americasarmy` | America's Army (2002)
| `americasarmy2` | America's Army 2 (2003)
| `americasarmy3` | America's Army 3 (2009) | [Valve Protocol](#valve)
| `americasarmypg` | America's Army: Proving Grounds (2015) | [Valve Protocol](#valve)
| `arcasimracing` | Arca Sim Racing (2008)
| `arkse`    | Ark: Survival Evolved (2017) | [Valve Protocol](#valve)
| `arma2`    | ARMA 2 (2009) | [Valve Protocol](#valve)
| `arma2oa`  | ARMA 2: Operation Arrowhead (2010) | [Valve Protocol](#valve)
| `arma3`    | ARMA 3 (2013) | [Valve Protocol](#valve)
| `arma`     | ARMA: Armed Assault (2007)
| `armacwa`  | ARMA: Cold War Assault (2011)
| `armar`    | ARMA: Resistance (2011)
| `armagetron` | Armagetron Advanced (2001)
| `assettocorsa` | Assetto Corsa (2014)
| `atlas`    | Atlas (2018) | [Valve Protocol](#valve)
| `baldursgate` | Baldur's Gate (1998)
| `bat1944`  | Battalion 1944 (2018) | [Valve Protocol](#valve)
| `bf1942`   | Battlefield 1942 (2002)
| `bf2`      | Battlefield 2 (2005)
| `bf2142`   | Battlefield 2142 (2006)
| `bf3`      | Battlefield 3 (2011)
| `bf4`      | Battlefield 4 (2013)
| `bfh`      | Battlefield Hardline (2015)
| `bfv`      | Battlefield Vietnam (2004)
| `bfbc2`    | Battlefield: Bad Company 2 (2010)
| `breach`   | Breach (2011) | [Valve Protocol](#valve)
| `breed`    | Breed (2004)
| `brink`    | Brink (2011) | [Valve Protocol](#valve)
| `buildandshoot` | Build and Shoot / Ace of Spades Classic (2012)
| `cod`      | Call of Duty (2003)
| `cod2`     | Call of Duty 2 (2005)
| `cod3`     | Call of Duty 3 (2006)
| `cod4`     | Call of Duty 4: Modern Warfare (2007)
| `codmw2`   | Call of Duty: Modern Warfare 2 (2009)
| `codmw3`   | Call of Duty: Modern Warfare 3 (2011) | [Valve Protocol](#valve)
| `coduo`    | Call of Duty: United Offensive (2004)
| `codwaw`   | Call of Duty: World at War (2008)
| `callofjuarez` | Call of Juarez (2006)
| `chaser`   | Chaser (2003)
| `chrome`   | Chrome (2003)
| `codenameeagle` | Codename Eagle (2000)
| `cacrenegade` | Command and Conquer: Renegade (2002)
| `commandos3` | Commandos 3: Destination Berlin (2003)
| `conanexiles` | Conan Exiles (2018) | [Valve Protocol](#valve)
| `contagion` | Contagion (2011) | [Valve Protocol](#valve)
| `contactjack` | Contract J.A.C.K. (2003)
| `cs15`     | Counter-Strike 1.5 (2002) | [Valve Protocol](#valve)
| `cs16`     | Counter-Strike 1.6 (2003) | [Valve Protocol](#valve)
| `cs2d`     | Counter-Strike: 2D (2004)
| `cscz`     | Counter-Strike: Condition Zero (2004) | [Valve Protocol](#valve)
| `csgo`     | Counter-Strike: Global Offensive (2012) | [Notes](#csgo), [Valve Protocol](#valve)
| `css`      | Counter-Strike: Source (2004) | [Valve Protocol](#valve)
| `crossracing` | Cross Racing Championship Extreme 2005 (2005)
| `crysis`   | Crysis (2007)
| `crysis2`  | Crysis 2 (2011)
| `crysiswars` | Crysis Wars (2008)
| `daikatana` | Daikatana (2000)
| `dnl`      | Dark and Light (2017) | [Valve Protocol](#valve)
| `dmomam`   | Dark Messiah of Might and Magic (2006) | [Valve Protocol](#valve)
| `darkesthour` | Darkest Hour: Europe '44-'45 (2008)
| `dod`      | Day of Defeat (2003) | [Valve Protocol](#valve)
| `dods`     | Day of Defeat: Source (2005) | [Valve Protocol](#valve)
| `doi`      | Day of Infamy (2017) | [Valve Protocol](#valve)
| `daysofwar` | Days of War (2017) | [Valve Protocol](#valve)
| `dayz`     | DayZ (2018) | [Valve Protocol](#valve)
| `dayzmod`  | DayZ Mod (2013) | [Valve Protocol](#valve)
| `deadlydozenpt` | Deadly Dozen: Pacific Theater (2002)
| `dh2005`   | Deer Hunter 2005 (2004)
| `descent3` | Descent 3 (1999)
| `deusex`   | Deus Ex (2000)
| `devastation` | Devastation (2003)
| `dinodday` | Dino D-Day (2011) | [Valve Protocol](#valve)
| `dirttrackracing2` | Dirt Track Racing 2 (2002)
| `discord`  | Discord | [Notes](#discord)
| `doom3`    | Doom 3 (2004)
| `dota2`    | Dota 2 (2013) | [Valve Protocol](#valve)
| `drakan`   | Drakan: Order of the Flame (1999)
| `empyrion` | Empyrion - Galactic Survival (2015) | [Valve Protocol](#valve)
| `etqw`     | Enemy Territory: Quake Wars (2007)
| `fear`     | F.E.A.R. (2005)
| `f1c9902`  | F1 Challenge '99-'02 (2002)
| `farcry`   | Far Cry (2004)
| `farcry2`  | Far Cry 2 (2008)
| `f12002`   | Formula One 2002 (2002)
| `fortressforever` | Fortress Forever (2007) | [Valve Protocol](#valve)
| `ffow`     | Frontlines: Fuel of War (2008)
| `garrysmod` | Garry's Mod (2004) | [Valve Protocol](#valve)
| `geneshift`<br>`mutantfactions` | Geneshift (2017)
| `giantscitizenkabuto` | Giants: Citizen Kabuto (2000)
| `globaloperations` | Global Operations (2002)
| `ges`      | GoldenEye: Source (2010) | [Valve Protocol](#valve)
| `gore`     | Gore: Ultimate Soldier (2002)
| `fivem`    | Grand Theft Auto V - FiveM (2013)
| `mtasa`    | Grand Theft Auto: San Andreas - Multi Theft Auto (2004)
| `mtavc`    | Grand Theft Auto: Vice City - Multi Theft Auto (2002)
| `gunmanchronicles` | Gunman Chronicles (2000) | [Valve Protocol](#valve)
| `hl2dm`    | Half-Life 2: Deathmatch (2004) | [Valve Protocol](#valve)
| `hldm`     | Half-Life Deathmatch (1998) | [Valve Protocol](#valve)
| `hldms`    | Half-Life Deathmatch: Source (2005) | [Valve Protocol](#valve)
| `halo`     | Halo (2003)
| `halo2`    | Halo 2 (2007)
| `hll`      | Hell Let Loose | [Valve Protocol](#valve)
| `heretic2` | Heretic II (1998)
| `hexen2`   | Hexen II (1997)
| `had2`     | Hidden & Dangerous 2 (2003)
| `homefront` | Homefront (2011) | [Valve Protocol](#valve)
| `homeworld2` | Homeworld 2 (2003)
| `hurtworld` | Hurtworld (2015) | [Valve Protocol](#valve)
| `igi2`     | I.G.I.-2: Covert Strike (2003)
| `il2`      | IL-2 Sturmovik (2001)
| `insurgency` | Insurgency (2014) | [Valve Protocol](#valve)
| `insurgencysandstorm` | Insurgency: Sandstorm (2018) | [Valve Protocol](#valve)
| `ironstorm` | Iron Storm (2002)
| `jamesbondnightfire` | James Bond 007: Nightfire (2002)
| `jc2mp`    | Just Cause 2 - Multiplayer (2010)
| `jc3mp`    | Just Cause 3 - Multiplayer (2017) | [Valve Protocol](#valve)
| `kspdmp`   | Kerbal Space Program - DMP Multiplayer (2015)
| `killingfloor` | Killing Floor (2009)
| `killingfloor2` | Killing Floor 2 (2016) | [Valve Protocol](#valve)
| `kingpin`  | Kingpin: Life of Crime (1999)
| `kisspc`   | Kiss: Psycho Circus: The Nightmare Child (2000)
| `kzmod`    | Kreedz Climbing (2017) | [Valve Protocol](#valve)
| `left4dead` | Left 4 Dead (2008) | [Valve Protocol](#valve)
| `left4dead2` | Left 4 Dead 2 (2009) | [Valve Protocol](#valve)
| `m2mp`     | Mafia II - Multiplayer (2010)
| `m2o`      | Mafia II - Online (2010)
| `moh2010`  | Medal of Honor (2010)
| `mohab`    | Medal of Honor: Airborne (2007)
| `mohaa`    | Medal of Honor: Allied Assault (2002)
| `mohbt`    | Medal of Honor: Allied Assault Breakthrough (2003)
| `mohsh`    | Medal of Honor: Allied Assault Spearhead (2002)
| `mohpa`    | Medal of Honor: Pacific Assault (2004)
| `mohwf`    | Medal of Honor: Warfighter (2012)
| `medievalengineers` | Medieval Engineers (2015) | [Valve Protocol](#valve)
| `minecraft`<br>`minecraftping` | Minecraft (2009)
| `minecraftpe`<br>`minecraftbe` | Minecraft: Bedrock Edition (2011)
| `mnc`      | Monday Night Combat (2011) | [Valve Protocol](#valve)
| `mordhau`  | Mordhau (2019) | [Valve Protocol](#valve)
| `mumble`   | Mumble - GTmurmur Plugin (2005) | [Notes](#mumble)
| `mumbleping` | Mumble - Lightweight (2005) | [Notes](#mumble)
| `nascarthunder2004` | NASCAR Thunder 2004 (2003)
| `ns`       | Natural Selection (2002) | [Valve Protocol](#valve)
| `ns2`      | Natural Selection 2 (2012) | [Valve Protocol](#valve)
| `nfshp2`   | Need for Speed: Hot Pursuit 2 (2002)
| `nab`      | Nerf Arena Blast (1999)
| `netpanzer` | netPanzer (2002)
| `nwn`      | Neverwinter Nights (2002)
| `nwn2`     | Neverwinter Nights 2 (2006)
| `nexuiz`   | Nexuiz (2005)
| `nitrofamily` | Nitro Family (2004)
| `nmrih`    | No More Room in Hell (2011) | [Valve Protocol](#valve)
| `nolf2`    | No One Lives Forever 2: A Spy in H.A.R.M.'s Way (2002)
| `nucleardawn` | Nuclear Dawn (2011) | [Valve Protocol](#valve)
| `openarena` | OpenArena (2005)
| `openttd`  | OpenTTD (2004)
| `operationflashpoint`<br>`flashpoint` | Operation Flashpoint: Cold War Crisis (2001)
| `flashpointresistance` | Operation Flashpoint: Resistance (2002)
| `painkiller` | Painkiller
| `pixark`   | PixARK (2018) | [Valve Protocol](#valve)
| `ps`       | Post Scriptum
| `postal2`  | Postal 2
| `prey`     | Prey
| `primalcarnage` | Primal Carnage: Extinction | [Valve Protocol](#valve)
| `prbf2`    | Project Reality: Battlefield 2 (2005)
| `przomboid` | Project Zomboid | [Valve Protocol](#valve)
| `quake1`   | Quake 1: QuakeWorld (1996)
| `quake2`   | Quake 2 (1997)
| `quake3`   | Quake 3: Arena (1999)
| `quake4`   | Quake 4 (2005)
| `quakelive` | Quake Live (2010) | [Valve Protocol](#valve)
| `ragdollkungfu` | Rag Doll Kung Fu | [Valve Protocol](#valve)
| `r6`       | Rainbow Six
| `r6roguespear` | Rainbow Six 2: Rogue Spear
| `r6ravenshield` | Rainbow Six 3: Raven Shield
| `rallisportchallenge` | RalliSport Challenge
| `rallymasters` | Rally Masters
| `redorchestra` | Red Orchestra
| `redorchestra2` | Red Orchestra 2 | [Valve Protocol](#valve)
| `redorchestraost` | Red Orchestra: Ostfront 41-45
| `redline`  | Redline
| `rtcw`     | Return to Castle Wolfenstein
| `rfactor`  | rFactor
| `ricochet` | Ricochet | [Valve Protocol](#valve)
| `riseofnations` | Rise of Nations
| `rs2`      | Rising Storm 2: Vietnam | [Valve Protocol](#valve)
| `rune`     | Rune
| `rust`     | Rust | [Valve Protocol](#valve)
| `stalker`  | S.T.A.L.K.E.R.
| `samp`     | San Andreas Multiplayer
| `savage2`  | Savage 2: A Tortured Soul (2008)
| `ss`       | Serious Sam
| `ss2`      | Serious Sam 2
| `shatteredhorizon` | Shattered Horizon | [Valve Protocol](#valve)
| `shogo`    | Shogo
| `shootmania` | Shootmania | [Notes](#nadeo-shootmania--trackmania--etc)
| `sin`      | SiN
| `sinep`    | SiN Episodes | [Valve Protocol](#valve)
| `soldat`   | Soldat
| `sof`      | Soldier of Fortune
| `sof2`     | Soldier of Fortune 2
| `spaceengineers` | Space Engineers | [Valve Protocol](#valve)
| `squad`    | Squad | [Valve Protocol](#valve)
| `stbc`     | Star Trek: Bridge Commander
| `stvef`    | Star Trek: Voyager - Elite Force
| `stvef2`   | Star Trek: Voyager - Elite Force 2
| `swjk2`    | Star Wars Jedi Knight II: Jedi Outcast (2002)
| `swjk`     | Star Wars Jedi Knight: Jedi Academy (2003)
| `swbf`     | Star Wars: Battlefront
| `swbf2`    | Star Wars: Battlefront 2
| `swrc`     | Star Wars: Republic Commando
| `starbound` | Starbound | [Valve Protocol](#valve)
| `starmade` | StarMade
| `starsiege` | Starsiege (2009)
| `suicidesurvival` | Suicide Survival | [Valve Protocol](#valve)
| `svencoop` | Sven Coop | [Valve Protocol](#valve)
| `swat4`    | SWAT 4
| `synergy`  | Synergy | [Valve Protocol](#valve)
| `tacticalops` | Tactical Ops
| `takeonhelicopters` | Take On Helicopters (2011)
| `teamfactor` | Team Factor
| `tf2`      | Team Fortress 2 | [Valve Protocol](#valve)
| `tfc`      | Team Fortress Classic | [Valve Protocol](#valve)
| `teamspeak2` | Teamspeak 2
| `teamspeak3` | Teamspeak 3 | [Notes](#teamspeak3)
| `terminus` | Terminus
| `terraria`<br>`tshock` | Terraria - TShock (2011) | [Notes](#terraria)
| `forrest`  | The Forrest (2014) | [Valve Protocol](#valve)
| `hidden`   | The Hidden (2005) | [Valve Protocol](#valve)
| `nolf`     | The Operative: No One Lives Forever (2000)
| `ship`     | The Ship | [Valve Protocol](#valve)
| `graw`     | Tom Clancy's Ghost Recon Advanced Warfighter (2006)
| `graw2`    | Tom Clancy's Ghost Recon Advanced Warfighter 2 (2007)
| `thps3`    | Tony Hawk's Pro Skater 3
| `thps4`    | Tony Hawk's Pro Skater 4
| `thu2`     | Tony Hawk's Underground 2
| `towerunite` | Tower Unite | [Valve Protocol](#valve)
| `trackmania2` | Trackmania 2 | [Notes](#nadeo-shootmania--trackmania--etc)
| `trackmaniaforever` | Trackmania Forever | [Notes](#nadeo-shootmania--trackmania--etc)
| `tremulous` | Tremulous
| `tribes1`  | Tribes 1: Starsiege
| `tribesvengeance` | Tribes: Vengeance
| `tron20`   | Tron 2.0
| `turok2`   | Turok 2
| `universalcombat` | Universal Combat
| `unreal`   | Unreal
| `ut`       | Unreal Tournament
| `ut2003`   | Unreal Tournament 2003
| `ut2004`   | Unreal Tournament 2004
| `ut3`      | Unreal Tournament 3
| `unturned` | unturned | [Valve Protocol](#valve)
| `urbanterror` | Urban Terror
| `v8supercar` | V8 Supercar Challenge
| `valheim`  | Valheim (2021) | [Notes](#valheim), [Valve Protocol](#valve)
| `ventrilo` | Ventrilo
| `vcmp`     | Vice City Multiplayer
| `vietcong` | Vietcong
| `vietcong2` | Vietcong 2
| `warsow`   | Warsow
| `wheeloftime` | Wheel of Time
| `wolfenstein2009` | Wolfenstein 2009
| `wolfensteinet` | Wolfenstein: Enemy Territory
| `xpandrally` | Xpand Rally
| `zombiemaster` | Zombie Master | [Valve Protocol](#valve)
| `zps`      | Zombie Panic: Source | [Valve Protocol](#valve)

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
* ECO Global Survival ([Ref](https://github.com/Austinb/GameQ/blob/v3/src/GameQ/Protocols/Eco.php))
* Farming Simulator
* Freelancer
* Ghost Recon
* GRAV Online
* GTA Network ([Ref](https://github.com/Austinb/GameQ/blob/v3/src/GameQ/Protocols/Gtan.php))
* GTR 2
* Haze
* Hexen World
* Lost Heaven
* Multi Theft Auto
* Pariah
* Plain Sight
* Purge Jihad
* Red Eclipse
* Red Faction
* S.T.A.L.K.E.R. Clear Sky
* Savage: The Battle For Newerth
* SiN 1 Multiplayer
* South Park
* Star Wars Jedi Knight: Dark Forces II
* Star Wars: X-Wing Alliance
* Sum of All Fears
* Teeworlds
* Tibia ([Ref](https://github.com/Austinb/GameQ/blob/v3/src/GameQ/Protocols/Tibia.php))
* Titanfall
* Tribes 2
* Unreal 2 XMP
* World in Conflict
* World Opponent Network
* Wurm Unlimited

> Want support for one of these games? Please open an issue to show your interest!
> __Know how to code?__ Protocol details for many of the games above are documented
> at https://github.com/gamedig/legacy-query-library-archive
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

### Discord
You must set the `guildId` request field to the server's guild ID. Do not provide an IP.
The Guild ID can be found in server widget settings (Server ID) or by enabling developer mode in client settings and right-clicking the server's icon.
In order to retrieve information from discord server's they must have the `Enable server widget` option enabled.

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

In the extremely unusual case that your server host responds to queries on a non-default port (the default is 10011),
you can specify their host query port using the teamspeakQueryPort option.

### Terraria
Requires tshock server mod, and a REST user token, which can be passed to GameDig with the
additional option: `token`

### Valheim
Valheim servers will only respond to queries if they are started in public mode (`-public 1`).

### DayZ
DayZ stores some of it's servers information inside the `tags` attribute. Make sure to set `requestRules: true` to access it. Some data inside `dayzMods` attribute may be fuzzy, due to how mods are loaded into the servers. Alternatively, some servers may have a [third party tool](https://dayzsalauncher.com/#/tools) that you can use to get the mods information. If it's installed, you can access it via browser with the game servers IP:PORT, but add up 10 to the port. (eg. if game port is 2302 then use 2312).

### <a name="valve"></a>Valve Protocol
For many valve games, additional 'rules' may be fetched into the unstable `raw` field by passing the additional
option: `requestRules: true`. Beware that this may increase query time.

Common Issues
---

### Firewalls block incoming UDP
*(replit / docker / some VPS providers)*

Most game query protocols require a UDP request and response. This means that in some environments, gamedig may not be able to receive the reponse required due to environmental restrictions.

Some examples include:
* Docker containers
  * You may need to run the container in `--network host` mode so that gamedig can bind a UDP listen port.
  * Alternatively, you can forward a single UDP port to your container, and force gamedig to listen on that port using the
  instructions in the section down below.
* replit
  * Most online IDEs run in an isolated container, which will never receive UDP responses from outside networks.
* Various VPS / server providers
  * Even if your server provider doesn't explicitly block incoming UDP packets, some server hosts block other server hosts from connecting to them for DDOS-mitigation and anti-botting purposes.

### Gamedig doesn't work in the browser
Gamedig cannot operate within a browser. This means you cannot package it as part of your webpack / browserify / rollup / parcel package.
Even if you were able to get it packaged into a bundle, unfortunately no browsers support the UDP protocols required to query server status
from most game servers. As an alternative, we'd recommend using gamedig on your server-side, then expose your own API to your webapp's frontend
displaying the status information. If your application is thin (with no constant server component), you may wish to investigate a server-less lambda provider.

### Specifying a listen UDP port override
In some very rare scenarios, you may need to bind / listen on a fixed local UDP port. The is usually not needed except behind
some extremely strict firewalls, or within a docker container (where you only wish to forward a single UDP port).
To use a fixed listen udp port, construct a new Gamedig object like this:
```
const gamedig = new Gamedig({
    listenUdpPort: 13337
});
gamedig.query(...)
```

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
as well: `--debug`, `--pretty`, `--socketTimeout 5000`, `--requestRules` etc.
