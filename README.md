# node-GameDig - Game Server Query Library
[![npmjs.com](https://img.shields.io/npm/dt/gamedig?color=purple)](https://www.npmjs.com/package/gamedig) ![deno compatibility](https://shield.deno.dev/deno/>=1.39.2) ![Static Badge](https://img.shields.io/badge/node-%3E%3D16.20.0-green?logo=node.js&logoColor=green)

**node-GameDig** is a game server query Node.js module (as well as a [command line executable](#usage-from-command-line)), 
capable of querying for the status of nearly any game or voice server.

If a server makes its status publically available, GameDig can fetch it for you.

Support is available on the [Discord](https://discord.gg/NVCMn3tnxH) for questions, or [GitHub](https://github.com/gamedig/node-gamedig/issues) for bugs.

**Are you updating from v4 to v5?** Many game ids have changed.  
Make sure to check if your game's ID is in the [id migration document](MIGRATE_IDS.md) and don't forget to check the [changelog](CHANGELOG.md) file.

## Games List
**node-GameDig** can query over 320 games + a few services!  
See the [GAMES_LIST.md](GAMES_LIST.md) file for the currently supported titles, not yet supported titles and notes about some of them.

## Usage from Node.js
Install using your favorite package manager: `npm install gamedig`, then use!
```js
import { GameDig } from 'gamedig';
// Or if you're using CommonJS:
// const { GameDig } = require('gamedig'); 

GameDig.query({
    type: 'minecraft',
    host: 'mc.hypixel.net'
}).then((state) => {
    console.log(state);
}).catch((error) => {
    console.log(`Server is offline, error: ${error}`);
});
```
Confused on how this works, or you want to see more? Checkout the [examples](/examples) folder!

## Required Fields

| Field    | Type   | Description                                                    |
|:---------|:-------|:---------------------------------------------------------------|
| **type** | string | One of the game type IDs listed in the [games list](GAMES_LIST.md). Or you can use `protocol-[name]` to select a specific protocol. Protocols are listed [here](protocols/index.js). |
| **host** | string | Hostname or IP of the game server.                             |

## Optional Fields

| Field                      | Type    | Default   | Description                                                                                                                                                                                                                   |
|:---------------------------|:--------|:----------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **address**                | string  | undefined | Override the IP address of the server skipping DNS resolution. When set, host will not be resolved, instead address will be connected to. However, some protocols still use host for other reasons e.g. as part of the query. |
| **port**                   | number  | Game port | Connection port or query port for the game server. Some games utilize a separate "query" port. If specifying the game port does not seem to work as expected, passing in this query port may work instead.                    |
| **maxRetries**             | number  | 1         | Number of retries to query server in case of failure. Note that this amount multiplies with the number of attempts.                                                                                                           |
| **socketTimeout**          | number  | 2000      | Milliseconds to wait for a single packet. Beware that increasing this will cause many queries to take longer even if the server is online.                                                                                    |
| **attemptTimeout**         | number  | 10000     | Milliseconds allowed for an entire query attempt. This timeout is not commonly hit, as the socketTimeout typically fires first.                                                                                               |
| **givenPortOnly**          | boolean | false     | Only attempt to query server on given port. It will ignore the game's default port.                                                                                                                                           |
| **ipFamily**               | number  | 0         | IP family/version returned when looking up hostnames via DNS, can be 0 (IPv4 and IPv6), 4 (IPv4 only) or 6 (IPv6 only).                                                                                                       |
| **debug**                  | boolean | false     | Enables massive amounts of debug logging to stdout.                                                                                                                                                                           |
| **requestRules**           | boolean | false     | Valve games only. Additional 'rules' may be fetched into the `raw` key.                                                                                                                                                       |
| **requestRulesRequired**   | boolean | false     | Valve games only. `requestRules` is always required to have a response or the query will timeout.                                                                                                                             |
| **requestPlayersRequired** | boolean | false     | Valve games only. Querying players is always required to have a response or the query will timeout. Some [games](GAMES_LIST.md) may not provide a players response.                                                           |
| **stripColors**            | boolean | true      | Enables stripping colors for protocols: unreal2, savage2, quake3, nadeo, gamespy2, doom3, armagetron.                                                                                                                         |
| **portCache**              | boolean | true      | After you queried a server, the second time you query that exact server (identified by specified ip and port), first add an attempt to query with the last successful port.                                                   |
| **noBreadthOrder**         | boolean | false     | Enable the behaviour of retrying an attempt X times followed by the next attempt X times, otherwise try attempt A, then B, then A, then B until reaching the X retry count of each.                                           |
| **checkOldIDs**            | boolean | false     | Also checks the old ids amongst the current ones.                                                                                                                                                                             |

## Query Response

The returned state object will contain the following keys:

| Key              | Type             | Description                                                                                                                                                                                                                                                                                                                |
|:-----------------|:-----------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **name**         | string           | Server name.                                                                                                                                                                                                                                                                                                               |
| **map**          | string           | Server map.                                                                                                                                                                                                                                                                                                                |
| **password**     | boolean          | If a password is required.                                                                                                                                                                                                                                                                                                 |
| **numplayers**   | number           | Number of players connected.                                                                                                                                                                                                                                                                                               |
| **maxplayers**   | number           | Maximum number of connected players.                                                                                                                                                                                                                                                                                       |
| **players**      | array of objects | Note that this could be of a different length compared to **numplayers**.                                                                                                                                                                                                                                                  |
| **players.name** | string           | If the player's name is unknown, the string will be empty.                                                                                                                                                                                                                                                                 |
| **players.raw**  | object           | Additional information about the player if available.                                                                                                                                                                                                                                                                      |
| **bots**         | array of objects | Same schema as `players`.                                                                                                                                                                                                                                                                                                  |
| **connect**      | string           | This will typically include the game's `IP:PORT`. The port will reflect the server's game port, even if your request specified the game's query port in the request. For some games, this may be a server ID or connection URL if an IP:PORT is not appropriate for end-users.                                             |
| **ping**         | number           | Round trip time to the server (in milliseconds). Note that this is not the RTT of an ICMP echo, as ICMP packets are often blocked by NATs and node has poor support for raw sockets. This value is derived from the RTT of one of the query packets, which is usually quite accurate, but may add a bit due to server lag. |
| **queryPort**    | number           | Indicates on which port the query was done on, 0 if this is not applicable.                                                                                                                                                                                                                                                |
| **raw**          | object           | Contains all information received from the server in a disorganized format.                                                                                                                                                                                                                                                |

Note that `raw` (or **unstable**) objects contents MAY change on a per-protocol basis between GameDig patch releases (although not typical).

## Usage from Command Line

Want to integrate server queries from a batch script or other programming language?
You'll still need npm to install gamedig:
```shell
npm install gamedig -g
```

After installing gamedig globally, you can call gamedig via the command line:
```shell
gamedig --type minecraft mc.example.com:11234
# Alternatively, if you don't want to install gamedig globally, you can run it with npx:
npx gamedig --type minecraft mc.example.com:11234
```

The output of the command will be in JSON format.  
Additional advanced parameters can be passed in as well:
* `--debug`: Print debugging informations, useful when stating an issue.
* `--pretty`: Outputs the JSON format nicely.
* `--requestRules`: Request Valve games rules.
* `--givenPortOnly`: Run the query with the specified port only (if any).
* `--socketTimeout N`: Specifies socket timeout (where `N` is a number, eg. `5000`).
* ... and the rest in the same format.

## Deno
The minimum supported deno version is `1.39.2` and the `--allow-net` permission is required.

## Common Issues

### Firewalls block incoming UDP
*(replit / docker / some VPS providers)*

Most game query protocols require a UDP request and response. This means that in some environments, gamedig may not be able to receive the reponse required due to environmental restrictions.

Some examples include:
* Docker containers
  * You may need to run the container in `--network host` mode so that gamedig can bind a UDP listen port.
  * Alternatively, you can forward a single UDP port to your container, and force gamedig to listen on that port using the instructions in the section down below.
* replit
  * Most online IDEs run in an isolated container, which will never receive UDP responses from outside networks.
* Various VPS / server providers
  * Even if your server provider doesn't explicitly block incoming UDP packets, some server hosts block other server hosts from connecting to them for DDOS-mitigation and anti-botting purposes.

### Gamedig doesn't work in the browser
Gamedig cannot operate within a browser. This means you cannot package it as part of your webpack / browserify / rollup / parcel package.  
Even if you were able to get it packaged into a bundle, unfortunately no browsers support the UDP protocols required to query server status
from most game servers.  
As an alternative, we'd recommend using gamedig on your server-side, then expose your own API to your webapp's frontend
displaying the status information. If your application is thin (with no constant server component), you may wish to investigate a server-less lambda provider.

### Specifying a listen UDP port override
In some very rare scenarios, you may need to bind / listen on a fixed local UDP port. The is usually not needed except behind
some extremely strict firewalls, or within a docker container (where you only wish to forward a single UDP port).  
To use a fixed listen udp port, construct a new Gamedig object like this:
```
const gamedig = new GameDig({
    listenUdpPort: 13337
});
gamedig.query(...)
```
