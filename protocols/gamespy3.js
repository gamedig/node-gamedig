const Core = require('./core');

class Gamespy3 extends Core {
    constructor() {
        super();
        this.sessionId = 1;
        this.encoding = 'latin1';
        this.byteorder = 'be';
        this.useOnlySingleSplit = false;
        this.isJc2mp = false;
    }

    async run(state) {
        const buffer = await this.sendPacket(9, false, false, false);
        const reader = this.reader(buffer);
        let challenge = parseInt(reader.string());
        this.debugLog("Received challenge key: " + challenge);
        if (challenge === 0) {
            // Some servers send us a 0 if they don't want a challenge key used
            // BF2 does this.
            challenge = null;
        }

        let requestPayload;
        if(this.isJc2mp) {
            // they completely alter the protocol. because why not.
            requestPayload = Buffer.from([0xff,0xff,0xff,0x02]);
        } else {
            requestPayload = Buffer.from([0xff,0xff,0xff,0x01]);
        }
        /** @type Buffer[] */
        const packets = await this.sendPacket(0,challenge,requestPayload,true);

        // iterate over the received packets
        // the first packet will start off with k/v pairs, followed with data fields
        // the following packets will only have data fields
        state.raw.playerTeamInfo = {};

        for(let iPacket = 0; iPacket < packets.length; iPacket++) {
            const packet = packets[iPacket];
            const reader = this.reader(packet);

            this.debugLog("Parsing packet #" + iPacket);
            this.debugLog(packet);

            // Parse raw server key/values

            if(iPacket === 0) {
                while(!reader.done()) {
                    const key = reader.string();
                    if(!key) break;

                    let value = reader.string();
                    while(value.match(/^p[0-9]+$/)) {
                        // fix a weird ut3 bug where some keys don't have values
                        value = reader.string();
                    }

                    state.raw[key] = value;
                    this.debugLog(key + " = " + value);
                }
            }

            // Parse player, team, item array state

            if(this.isJc2mp) {
                state.raw.numPlayers2 = reader.uint(2);
                while(!reader.done()) {
                    const player = {};
                    player.name = reader.string();
                    player.steamid = reader.string();
                    player.ping = reader.uint(2);
                    state.players.push(player);
                }
            } else {
                let firstMode = true;
                while(!reader.done()) {
                    if (reader.uint(1) <= 2) continue;
                    reader.skip(-1);
                    let fieldId = reader.string();
                    if(!fieldId) continue;
                    const fieldIdSplit = fieldId.split('_');
                    const fieldName = fieldIdSplit[0];
                    const itemType = fieldIdSplit.length > 1 ? fieldIdSplit[1] : 'no_';

                    if(!(itemType in state.raw.playerTeamInfo)) {
                        state.raw.playerTeamInfo[itemType] = [];
                    }
                    const items = state.raw.playerTeamInfo[itemType];

                    let offset = reader.uint(1);
                    firstMode = false;

                    this.debugLog(() => "Parsing new field: itemType=" + itemType + " fieldName=" + fieldName + " startOffset=" + offset);

                    while(!reader.done()) {
                        const item = reader.string();
                        if(!item) break;

                        while(items.length <= offset) { items.push({}); }
                        items[offset][fieldName] = item;
                        this.debugLog("* " + item);
                        offset++;
                    }
                }
            }
        }

        // Turn all that raw state into something useful

        if ('hostname' in state.raw) state.name = state.raw.hostname;
        else if('servername' in state.raw) state.name = state.raw.servername;
        if ('mapname' in state.raw) state.map = state.raw.mapname;
        if (state.raw.password === '1') state.password = true;
        if ('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);
        if ('hostport' in state.raw) state.gamePort = parseInt(state.raw.hostport);

        if('' in state.raw.playerTeamInfo) {
            for (const playerInfo of state.raw.playerTeamInfo['']) {
                const player = {};
                for(const from of Object.keys(playerInfo)) {
                    let key = from;
                    let value = playerInfo[from];

                    if(key === 'player') key = 'name';
                    if(key === 'score' || key === 'ping' || key === 'team' || key === 'deaths' || key === 'pid') value = parseInt(value);
                    player[key] = value;
                }
                state.players.push(player);
            }
        }
    }

    async sendPacket(type,challenge,payload,assemble) {
        const challengeLength = challenge === null ? 0 : 4;
        const payloadLength = payload ? payload.length : 0;

        const b = Buffer.alloc(7 + challengeLength + payloadLength);
        b.writeUInt8(0xFE, 0);
        b.writeUInt8(0xFD, 1);
        b.writeUInt8(type, 2);
        b.writeUInt32BE(this.sessionId, 3);
        if(challengeLength) b.writeInt32BE(challenge, 7);
        if(payloadLength) payload.copy(b, 7+challengeLength);

        let numPackets = 0;
        const packets = {};
        return await this.udpSend(b,(buffer) => {
            const reader = this.reader(buffer);
            const iType = reader.uint(1);
            if(iType !== type) return;
            const iSessionId = reader.uint(4);
            if(iSessionId !== this.sessionId) return;

            if(!assemble) {
                return reader.rest();
            }
            if(this.useOnlySingleSplit) {
                // has split headers, but they are worthless and only one packet is used
                reader.skip(11);
                return [reader.rest()];
            }

            reader.skip(9); // filler data -- usually set to 'splitnum\0'
            let id = reader.uint(1);
            const last = (id & 0x80);
            id = id & 0x7f;
            if(last) numPackets = id+1;

            reader.skip(1); // "another 'packet number' byte, but isn't understood."

            packets[id] = reader.rest();
            if(this.debug) {
                this.debugLog("Received packet #"+id + (last ? " (last)" : ""));
            }

            if(!numPackets || Object.keys(packets).length !== numPackets) return;

            // assemble the parts
            const list = [];
            for(let i = 0; i < numPackets; i++) {
                if(!(i in packets)) {
                    throw new Error('Missing packet #'+i);
                }
                list.push(packets[i]);
            }
            return list;
        });
    }
}

module.exports = Gamespy3;
