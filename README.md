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

State Object
---
The callback function is "guaranteed" to be called exactly once, indicating either a query error or timeout
(in the state's error key), or with a state object containg the successful results.

The returned state object may contain some or all of the following keys:

* error
* name
* numplayers
* maxplayers
* players
 * name
 * ping
 * score
* map
* gametype

Many other keys will also be available will be available on a game by game basis.

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
 * (requires additional 'login' and 'password' parameters for User login on server)
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
