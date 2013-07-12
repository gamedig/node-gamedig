node-GameDig - Game Server Query Library
---

Usage
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

Input Parameters
---
* type (one of the types from the protocols folder)
* host
* port (uses the protocol default if not set)
* login (required by nadeo protocol)
* password (required by nadeo protocol)

Callback Function
---
The callback function is "guaranteed" to be called exactly once.

If an error occurs, the returned object will contain an "error" key, indicating the issue.
If the error key exists, it should be assumed that the game server is offline or unreachable.

Otherwise, the returned object is guaranteed to contain the following keys:

* name
* map
* password (boolean)
* maxplayers
* players (may contain name, ping, score, team, address)
* bots (same as players)
* raw (contains special keys depending on the type of server queried - UNSTABLE)
* notes (passed through from the input)
* query (details about the query performed)
 * host
 * address
 * port
 * type
 * pretty (a "pretty" string describing the game)

It can usually be assumed that the number of players online is equal to the length of the players array.
Some servers may return an additional player count number, which may be present in the unstable raw object.

Supported Games
---
* Armagetron
* Gamespy 3 Protocol
 * Minecraft
 * Unreal Tournament 3
* GoldSrc Engine
 * Half Life: Death Match
 * Ricochet
 * Counter-Strike: 1.6
 * + others
* Nadeo Protocol
 * Trackmania Forever
 * Trackmania 2
 * Shootmania
* Quake 2 Protocol
 * Quake 2
* Quake 3 Protocol
 * Quake 3 Arena
 * Quake 3 Team Arena
 * Warsow
* Source Engine
 * Counter-Strike: Source
 * Counter-Strike: Global Offensive
 * Team Fortress 2
 * + others
* Tshock Protocol
 * Terraria
* Unreal 2 Protocol
 * Killing Floor
 * Unreal Tournament 2004

Unstable API
---
The contents of the returned state object may change slightly from build to build, as the API
is still being formed.
