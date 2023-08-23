node-GameDig - Game Server Query Library
---
node-GameDig is a game server query library, capable of querying for the status of
nearly any game or voice server. If a server makes its status publically available,
GameDig can fetch it for you.

GameDig is available as a node.js module, as well as a
[command line executable](#usage-from-command-line).

Support is available on the [GameDig Discord](https://discord.gg/NVCMn3tnxH) (for questions), or [GitHub Issues](https://github.com/gamedig/node-gamedig/issues) (for bugs).

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
* **ipFamily**: number - IP family/version returned when looking up hostnames via DNS, can be 0 (IPv4 and IPv6), 4 (IPv4 only) or 6 (IPv6 only). (default 0)
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
See the [GAMES_LIST.md](GAMES_LIST.md) file for the currently supported games, not yet supported games and notes about some of them.

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

Alternatively, if you don't want to install gamedig globally, you can run it with npx:
```shell
npx gamedig --type minecraft mc.example.com:11234
```

The output of the command will be in JSON format. Additional advanced parameters can be passed in
as well: `--debug`, `--pretty`, `--socketTimeout 5000`, `--requestRules` etc.
