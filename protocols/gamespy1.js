const Core = require('./core');

class Gamespy1 extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    async run(state) {
        {
            const data = await this.sendPacket('info');
            state.raw = data;
            if ('hostname' in state.raw) state.name = state.raw.hostname;
            if ('mapname' in state.raw) state.map = state.raw.mapname;
            if (this.trueTest(state.raw.password)) state.password = true;
            if ('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);
            if ('hostport' in state.raw) state.gamePort = parseInt(state.raw.hostport);
        }
        {
            const data = await this.sendPacket('rules');
            state.raw.rules = data;
        }
        {
            const data = await this.sendPacket('players');
            const playersById = {};
            const teamNamesById = {};
            for (const ident of Object.keys(data)) {
                const split = ident.split('_');
                let key = split[0];
                const id = split[1];
                let value = data[ident];

                if (key === 'teamname') {
                    teamNamesById[id] = value;
                } else {
                    if (!(id in playersById)) playersById[id] = {};
                    if (key === 'playername') {
                        key = 'name';
                    } else if (key === 'team' && !isNaN(parseInt(value))) {
                        key = 'teamId';
                        value = parseInt(value);
                    } else if (key === 'score' || key === 'ping' || key === 'deaths' || key === 'kills') {
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
                        player.team = teamNamesById[player.teamId - 1] || '';
                    } else {
                        player.team = player.teamId;
                        delete player.teamId;
                    }
                }

                state.players.push(player);
            }
        }
    }

    async sendPacket(type) {
        let receivedQueryId;
        const output = {};
        const parts = new Set();
        let maxPartNum = 0;

        return await this.udpSend('\\'+type+'\\', buffer => {
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
