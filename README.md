node-GameDig - Game Server Query Library
---

Usage
---

```javascript
var Gamedig = require('gamedig');
Gamedig.query({
	type: 'minecraft',
	host: 'mc.example.com',
	callback: function(state) {
		if(state.error) console.log("Server is offline");
		else console.log(state);
	}
});
```

State Object
---
The callback function is "guaranteed" to be called exactly once, indicating either a query error or timeout
(in the state's error key), or with a state object containg the successful results.

The returned state object may contain some or all of the following keys, depending on
what is available from the queried server:

* error
* numplayers
* maxplayers
* players
** name
** ping
** score
* map
* gametype
* name

Supported Games
---
* Armagetron
* Gamespy 3 Protocol
** 
* Unreal 2 Protocol
** Killing Floor
* Quake 2
* Quake 3
* Source Engine
** Counter-Strike: Source
** Counter-Strike: Global Offensive
** Team Fortress 2
** + others
* GoldSrc Engine
** Half Life: Death Match
** Ricochet
** Counter-Strike: 1.6
** + others

Unstable API
---
The contents of the returned state object may change slightly from build to build, as the API
is still being formed.
