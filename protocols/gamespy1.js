const Core = require('./core');

const stringKeys = new Set([
    'website',
    'gametype',
    'gamemode',
    'player'
]);

function normalizeEntry([key,value]) {
    key = key.toLowerCase();
    const split = key.split('_');
    let keyType;
    if (split.length === 2 && !isNaN(parseInt(split[1]))) {
        keyType = split[0];
    } else {
        keyType = key;
    }
    if (!stringKeys.has(keyType) && !keyType.includes('name')) {
        if (value.toLowerCase() === 'true') {
            value = true;
        } else if (value.toLowerCase() === 'false') {
            value = false;
        } else if (!isNaN(parseInt(value))) {
            value = parseInt(value);
        }
    }
    return [key,value];
}

class Gamespy1 extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    async run(state) {
        const raw = await this.sendPacket('\\status\\xserverquery');
        // Convert all keys to lowercase and normalize value types
        const data = Object.fromEntries(Object.entries(raw).map(entry => normalizeEntry(entry)));
        state.raw = data;
        if ('hostname' in data) state.name = data.hostname;
        if ('mapname' in data) state.map = data.mapname;
        if (this.trueTest(data.password)) state.password = true;
        if ('maxplayers' in data) state.maxplayers = parseInt(data.maxplayers);
        if ('hostport' in data) state.gamePort = parseInt(data.hostport);

        const teamOffByOne = data.gamename === 'bfield1942';
        const playersById = {};
        const teamNamesById = {};
        for (const ident of Object.keys(data)) {
            const split = ident.split('_');
            if (split.length !== 2) continue;
            let key = split[0].toLowerCase();
            const id = parseInt(split[1]);
            if (isNaN(id)) continue;
            let value = data[ident];

            delete data[ident];

            if (key !== 'team' && key.startsWith('team')) {
                // Info about a team
                if (key === 'teamname') {
                    teamNamesById[id] = value;
                } else {
                    // other team info which we don't track
                }
            } else {
                // Info about a player
                if (!(id in playersById)) playersById[id] = {};
                if (key === 'playername' || key === 'player') {
                    key = 'name';
                }
                if (key === 'team' && !isNaN(parseInt(value))) {
                    key = 'teamId';
                    value = parseInt(value) + (teamOffByOne ? -1 : 0);
                }
                if (key !== 'name' && !isNaN(parseInt(value))) {
                    value = parseInt(value);
                }
                playersById[id][key] = value;
            }
        }
        state.raw.teams = teamNamesById;

        const players = Object.values(playersById);

        const seenHashes = new Set();
        for (const player of players) {
            // Some servers (bf1942) report the same player multiple times (bug?)
            // Ignore these duplicates
            if (player.keyhash) {
                if (seenHashes.has(player.keyhash)) {
                    this.logger.debug("Rejected player with hash " + player.keyhash + " (Duplicate keyhash)");
                    continue;
                } else {
                    seenHashes.add(player.keyhash);
                }
            }

            // Convert player's team ID to team name if possible
            if (player.hasOwnProperty('teamId')) {
                if (Object.keys(teamNamesById).length) {
                    player.team = teamNamesById[player.teamId] || '';
                } else {
                    player.team = player.teamId;
                    delete player.teamId;
                }
            }

            state.players.push(player);
        }
    }

    async sendPacket(type) {
        let receivedQueryId;
        const output = {};
        const parts = new Set();
        let maxPartNum = 0;

        return await this.udpSend(type, buffer => {
            const reader = this.reader(buffer);
            const str = reader.string(buffer.length);
            const split = str.split('\\');
            split.shift();
            const data = {};
            while(split.length) {
                const key = split.shift();
                const value = split.shift() || '';
                data[key] = value;
            }

            let queryId, partNum;
            const partFinal = ('final' in data);
            if (data.queryid) {
                const split = data.queryid.split('.');
                if (split.length >= 2) {
                    partNum = parseInt(split[1]);
                }
                queryId = split[0];
            }
            delete data.final;
            delete data.queryid;
            this.logger.debug("Received part num=" + partNum + " queryId=" + queryId + " final=" + partFinal);

            if (queryId) {
                if (receivedQueryId && receivedQueryId !== queryId) {
                    this.logger.debug("Rejected packet (Wrong query ID)");
                    return;
                } else if (!receivedQueryId) {
                    receivedQueryId = queryId;
                }
            }
            if (!partNum) {
                partNum = parts.size;
                this.logger.debug("No part number received (assigned #" + partNum + ")");
            }
            if (parts.has(partNum)) {
                this.logger.debug("Rejected packet (Duplicate part)");
                return;
            }
            parts.add(partNum);
            if (partFinal) {
                maxPartNum = partNum;
            }

            this.logger.debug("Received part #" + partNum + " of " + (maxPartNum ? maxPartNum : "?"));
            for(const i of Object.keys(data)) {
                output[i] = data[i];
            }
            if (maxPartNum && parts.size === maxPartNum) {
                this.logger.debug("Received all parts");
                this.logger.debug(output);
                return output;
            }
        });
    }
}

module.exports = Gamespy1;
