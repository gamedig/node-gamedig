node-GameDig - Game Server Query Library
---

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

* Alien Swarm (alienswarm)
* Armagetron (armagetron)
* Build and Shoot (buildandshoot)
* Counter-Strike 1.6 (cs16)
* Counter-Strike: Source (css)
* Counter-Strike: Global Offensive (csgo)
* Dino D-Day (dinodday)
* Garry's Mod (garrysmod)
* The Hidden: Source (hidden)
* Just Cause Multiplayer (jcmp)
* Killing Floor (killingfloor)
* KzMod (kzmod)
* Left 4 Dead (left4dead)
* Left 4 Dead 2 (left4dead2)
* Minecraft (minecraft)
```
Some minecraft servers may not respond to a typical status query. If this is the case, try using the
'minecraftping' server type instead, which uses a less accurate but more reliable solution.
```
* Mutant Factions (mutantfactions)
* Natural Selection (ns)
* Natural Selection 2 (ns2)
* No More Room in Hell (nmrih)
* Nuclear Dawn (nucleardawn)
* Quake 2 (quake2)
* Quake 3 (quake3)
* Ricochet (ricochet)
* Rust (rust)
* The Ship (ship)
* ShootMania (shootmania)
```
Requires additional parameters: login, password
```
* Starbound (starbound)
* Suicide Survival (suicidesurvival)
* Sven Coop (svencoop)
* Synergy (synergy)
* Team Fortress 2 (tf2)
* Terraria (terraria)
```
Requires tshock server mod, and an additional parameter: token
```
* TrackMania 2 (trackmania2)
```
Requires additional parameters: login, password
```
* TrackMania Forever (trackmaniaforever)
```
Requires additional parameters: login, password
```
* Unreal Tournament 2004 (ut2004)
* Unreal Tournament 3 (ut3)
* Warsow (warsow)

Don't see your game listed here?
1. Let us know so we can fix it
2. You can try using some common query protocols directly by using one of these server types:
* protocol-gamespy3
* protocol-nadeo
* protocol-quake2
* protocol-quake3
* protocol-unreal2
* protocol-valve
* protocol-valvegold

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
