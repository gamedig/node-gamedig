node-GameDig - Game Server Query Library
---
node-GameDig is a game server library, capable of querying for the status of
nearly any game server. If has a node.js api, as well as a command line interface.

Usage from Node.js
---

```shell
npm install gamedig
```

```javascript
var Gamedig = require('gamedig');
Gamedig.query(
	{
		type: 'minecraft',
		host: 'mc.example.com'
	},
	function(state) {
		if(state.error) console.log("Server is offline");
		else console.log(state);
	}
);
```

> Is NPM out of date? If you're feeling lucky, you can install the latest code with
> ```shell
> npm install "git+https://github.com/sonicsnes/node-gamedig.git"
> ```

### Input Parameters

* **type**: One of the game IDs listed in the game list below
* **host**
* **port**: (optional) Uses the protocol default if not set
* **notes**: (optional) Passed through to output

###Callback Function

The callback function is "guaranteed" to be called exactly once.

If an error occurs, the returned object will contain an "error" key, indicating the issue.
If the error key exists, it should be assumed that the game server is offline or unreachable.

Otherwise, the returned object is guaranteed to contain the following keys:

**Stable, always present:**

* **name**
* **map**
* **password**: Boolean
* **maxplayers**
* **players**: (array of objects) Each object **may** contain name, ping, score, team, address
* **bots**: Same schema as players
* **notes**: Passed through from the input

**Unstable, not guaranteed:**

* **raw**: Contains all information received from the server
* **query**: Details about the query performed

It can usually be assumed that the number of players online is equal to the length of the players array.
Some servers may return an additional player count number, which may be present in the unstable raw object.

Supported Games
---

* Age of Chivalry (ageofchivalry)
* Alien Swarm (alienswarm)
* Aliens vs Predator 2 (avp2)
* America's Army 1 (americasarmy) [[Separate Query Port - Usually port+1](#separate-query-port)]
* America's Army 2 (americasarmy2) [[Separate Query Port - Usually port+1](#separate-query-port)]
* America's Army 3 (americasarmy3) [[Separate Query Port - Usually 27020](#separate-query-port)]
* America's Army: Proving Grounds (americasarmypg) [[Separate Query Port - Usually 27020](#separate-query-port)]
* ArmA Armed Assault 1 (arma)
* ArmA Armed Assault 2 (arma2)
* ArmA Armed Assault 3 (arma3)
* Armagetron (armagetron)
* Battlefield 1942 (bf1942) [[Separate Query Port - Usually 23000](#separate-query-port)]
* Battlefield 2 (bf2) [[Separate Query Port - Usually 29900](#separate-query-port)]
* Battlefield 3 (bf3) [[Separate Query Port - Usually port+22000](#separate-query-port)]
* Battlefield 4 (bf4) [[Separate Query Port - Usually port+22000](#separate-query-port)]
* Battlefield: Bad Company 2 (bfbc2) [[Separate Query Port - Usually 48888](#separate-query-port)]
* Battlefield: Vietnam (bfv) [[Separate Query Port - Usually 48888](#separate-query-port)]
* Brink (brink) [[Separate Query Port - Usually port+1](#separate-query-port)]
* Build and Shoot (buildandshoot)
* Call of Duty (cod)
* Call of Duty 2 (cod2)
* Call of Duty 4 (cod4)
* Call of Duty: Modern Warfare 3 (codmw3) [[Separate Query Port - Usually port+2](#separate-query-port)]
* Call of Duty: United Offensive (coduo)
* Call of Duty: World at War (codwaw)
* Counter-Strike 1.6 (cs16)
* Counter-Strike: Condition Zero (cscz)
* Counter-Strike: Source (css)
* Counter-Strike: Global Offensive (csgo)
* Crysis (crysis)
* Crysis 2 (crysis2)
* Crysis Wars (crysiswars)
* Darkest Hour (darkesthour) [[Separate Query Port - Usually port+1](#separate-query-port)]
* Day of Defeat (dod)
* Day of Defeat: Source (dods)
* DayZ (dayz) [[Separate Query Port - Usually 27016-27020](#separate-query-port)]
* Dino D-Day (dinodday)
* Doom 3 (doom3)
* DOTA 2 (dota2)
* Enemy Territory Quake Wars (etqw)
* F.E.A.R. (fear)
* Fortress Forever (fortressforever)
* Frontlines: Fuel of War (ffow)
* Garry's Mod (garrysmod)
* Ghost Recon: Advanced Warfighter (graw)
* Ghost Recon: Advanced Warfighter 2 (graw2)
* Gore (gore)
* Half-Life 1 Deathmatch (hldm)
* Half-Life 2 Deathmatch (hl2dm)
* Halo (halo)
* The Hidden: Source (hidden)
* Homefront (homefront)
* Insurgency (insurgency)
* Just Cause 2 Multiplayer (jc2mp)
* Killing Floor (killingfloor)
* KzMod (kzmod)
* Left 4 Dead (left4dead)
* Left 4 Dead 2 (left4dead2)
* Mafia 2 Multiplayer (m2mp) [[Separate Query Port - Usually port+1](#separate-query-port)]
* Medal of Honor: Allied Assault (mohaa) [[Separate Query Port - Usually port+97](#separate-query-port)]
* Medal of Honor: Spearhead (mohsh) [[Separate Query Port - Usually port+97](#separate-query-port)]
* Medal of Honor: Breakthrough (mohbt) [[Separate Query Port - Usually port+97](#separate-query-port)]
* Medal of Honor 2010 (moh2010) [[Separate Query Port - Usually 48888](#separate-query-port)]
* Medal of Honor: Warfighter (mohwf)
* Minecraft (minecraft) [[Additional Notes](#minecraft)]
* Monday Night Combat (mnc)
* Multi Theft Auto [[Separate Query Port - Usually port+123](#separate-query-port)]
* Mutant Factions (mutantfactions)
* Natural Selection (ns)
* Natural Selection 2 (ns2) [[Separate Query Port - Usually port+1](#separate-query-port)]
* No More Room in Hell (nmrih)
* Nuclear Dawn (nucleardawn)
* Prey (prey)
* Quake 1 (quake1)
* Quake 2 (quake2)
* Quake 3 (quake3)
* Quake 4 (quake4)
* Red Orchestra: Ostfront 41-45 (redorchestraost) [[Separate Query Port - Usually port+10](#separate-query-port)]
* Red Orchestra 2 (redorchestra2) [[Separate Query Port - Usually 27015](#separate-query-port)]
* Return to Castle Wolfenstein (rtcw)
* Ricochet (ricochet)
* Rust (rust)
* The Ship (ship)
* ShootMania (shootmania) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* Soldier of Fortune 2 (sof2)
* Star Wars: Battlefront 2 (swbf2)
* Star Wars: Jedi Knight (swjk)
* Star Wars: Jedi Knight 2 (swjk2)
* Starbound (starbound)
* Suicide Survival (suicidesurvival)
* SWAT 4 (swat4) [[Separate Query Port - Usually port+2](#separate-query-port)]
* Sven Coop (svencoop)
* Synergy (synergy)
* Team Fortress 2 (tf2)
* Team Fortress Classic (tfc)
* Terraria (terraria) [[Additional Notes](#terraria)]
* TrackMania 2 (trackmania2) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* TrackMania Forever (trackmaniaforever) [[Additional Notes](#nadeo-shootmania--trackmania--etc)]
* Unreal Tournament (ut) [[Separate Query Port - Usually port+1](#separate-query-port)]
* Unreal Tournament 2004 (ut2004) [[Separate Query Port - Usually port+1](#separate-query-port)]
* Unreal Tournament 3 (ut3) [[Separate Query Port - Usually 6500](#separate-query-port)]
* Warsow (warsow)
* Wolfenstein 2009 (wolfenstein2009)
* Wolfenstein: Enemy Territory (wolfensteinet)
* Zombie Master (zombiemaster)
* Zombie Panic: Source (zps)

Don't see your game listed here?

1. Let us know so we can fix it
1. You can try using some common query protocols directly by using one of these server types:
 * protocol-ase
 * protocol-battlefield
 * protocol-doom3
 * protocol-gamespy1
 * protocol-gamespy2
 * protocol-gamespy3
 * protocol-nadeo
 * protocol-quake2
 * protocol-quake3
 * protocol-unreal2
 * protocol-valve
 * protocol-valvegold

### Games with Additional Notes

#### Minecraft
Some minecraft servers may not respond to a typical status query. If this is the case, try using the
'minecraftping' server type instead, which uses a less accurate but more reliable solution.

#### Nadeo (ShootMania / TrackMania / etc)
The server must have xmlrpc enabled, and you must pass the xmlrpc port to GameDig, not the connection port.
You must have a user account on the server with access level User or higher.
Pass the login into to GameDig with the additional options: login, password

#### Terraria
Requires tshock server mod, and a REST user token, which can be passed to GameDig with the
additional option: token

#### Separate Query Port
Games with this note use a query port which is usually not the same as the game's connection port.
You must pass the query port to GameDig, not the connection port.

Usage from Command Line
---

Want to integrate server queries from a batch script or other programming language?
You'll still need npm to install gamedig:
```shell
npm install gamedig -g
```

After installing gamedig globally, you can call gamedig via the command line
using the same parameters mentioned in the API above:
```shell
gamedig --type minecraft --host mc.example.com --port 11234
```

The output of the command will be in JSON format.
