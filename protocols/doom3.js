const Core = require('./core');

class Doom3 extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
    }
    async run(state) {
        const body = await this.udpSend('\xff\xffgetInfo\x00PiNGPoNg\x00', packet => {
            const reader = this.reader(packet);
            const header = reader.uint(2);
            if(header !== 0xffff) return;
            const header2 = reader.string();
            if(header2 !== 'infoResponse') return;
            const challengePart1 = reader.string(4);
            if (challengePart1 !== "PiNG") return;
            // some doom3 implementations only return the first 4 bytes of the challenge
            const challengePart2 = reader.string(4);
            if (challengePart2 !== 'PoNg') reader.skip(-4);
            return reader.rest();
        });

        let reader = this.reader(body);
        const protoVersion = reader.uint(4);
        state.raw.protocolVersion = (protoVersion>>16)+'.'+(protoVersion&0xffff);

        // some doom implementations send us a packet size here, some don't (etqw does this)
        // we can tell if this is a packet size, because the third and fourth byte will be 0 (no packets are that massive)
        reader.skip(2);
        const packetContainsSize = (reader.uint(2) === 0);
        reader.skip(-4);

        if (packetContainsSize) {
            const size = reader.uint(4);
            this.debugLog("Received packet size: " + size);
        }

        while(!reader.done()) {
            const key = reader.string();
            let value = this.stripColors(reader.string());
            if(key === 'si_map') {
                value = value.replace('maps/','');
                value = value.replace('.entities','');
            }
            if(!key) break;
            state.raw[key] = value;
            this.debugLog(key + "=" + value);
        }

        const isEtqw = state.raw.gamename && state.raw.gamename.toLowerCase().includes('etqw');

        const rest = reader.rest();
        let playerResult = this.attemptPlayerParse(rest, isEtqw, false, false, false);
        if (!playerResult) playerResult = this.attemptPlayerParse(rest, isEtqw, true, false, false);
        if (!playerResult) playerResult = this.attemptPlayerParse(rest, isEtqw, true, true, true);
        if (!playerResult) {
            throw new Error("Unable to find a suitable parse strategy for player list");
        }
        let players;
        [players,reader] = playerResult;

        for (const player of players) {
            if(!player.ping || player.typeflag)
                state.bots.push(player);
            else
                state.players.push(player);
        }

        state.raw.osmask = reader.uint(4);
        if (isEtqw) {
            state.raw.ranked = reader.uint(1);
            state.raw.timeleft = reader.uint(4);
            state.raw.gamestate = reader.uint(1);
            state.raw.servertype = reader.uint(1);
            // 0 = regular, 1 = tv
            if(state.raw.servertype === 0) {
                state.raw.interestedClients = reader.uint(1);
            } else if(state.raw.servertype === 1) {
                state.raw.connectedClients = reader.uint(4);
                state.raw.maxClients = reader.uint(4);
            }
        }

        if (state.raw.si_name) state.name = state.raw.si_name;
        if (state.raw.si_map) state.map = state.raw.si_map;
        if (state.raw.si_maxplayers) state.maxplayers = parseInt(state.raw.si_maxplayers);
        if (state.raw.si_maxPlayers) state.maxplayers = parseInt(state.raw.si_maxplayers);
        if (state.raw.si_usepass === '1') state.password = true;
        if (state.raw.si_needPass === '1') state.password = true;
        if (this.options.port === 27733) state.gamePort = 3074; // etqw has a different query and game port
    }

    attemptPlayerParse(rest, isEtqw, hasClanTag, hasClanTagPos, hasTypeFlag) {
        this.debugLog("starting player parse attempt:");
        this.debugLog("isEtqw: " + isEtqw);
        this.debugLog("hasClanTag: " + hasClanTag);
        this.debugLog("hasClanTagPos: " + hasClanTagPos);
        this.debugLog("hasTypeFlag: " + hasTypeFlag);
        const reader = this.reader(rest);
        let lastId = -1;
        const players = [];
        while(true) {
            this.debugLog("---");
            if (reader.done()) {
                this.debugLog("* aborting attempt, overran buffer *");
                return null;
            }
            const player = {};
            player.id = reader.uint(1);
            this.debugLog("id: " + player.id);
            if (player.id <= lastId || player.id > 0x20) {
                this.debugLog("* aborting attempt, invalid player id *");
                return null;
            }
            lastId = player.id;
            if(player.id === 0x20) {
                this.debugLog("* player parse successful *");
                break;
            }
            player.ping = reader.uint(2);
            this.debugLog("ping: " + player.ping);
            if(!isEtqw) {
                player.rate = reader.uint(4);
                this.debugLog("rate: " + player.rate);
            }
            player.name = this.stripColors(reader.string());
            this.debugLog("name: " + player.name);
            if(hasClanTag) {
                if(hasClanTagPos) {
                    const clanTagPos = reader.uint(1);
                    this.debugLog("clanTagPos: " + clanTagPos);
                }
                player.clantag = this.stripColors(reader.string());
                this.debugLog("clan tag: " + player.clantag);
            }
            if(hasTypeFlag) {
                player.typeflag = reader.uint(1);
                this.debugLog("type flag: " + player.typeflag);
            }
            players.push(player);
        }
        return [players,reader];
    }

    stripColors(str) {
        // uses quake 3 color codes
        return str.replace(/\^(X.{6}|.)/g,'');
    }
}

module.exports = Doom3;
