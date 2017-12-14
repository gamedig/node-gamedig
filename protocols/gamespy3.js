const async = require('async');

class Gamespy3 extends require('./core') {
    constructor() {
        super();
        this.sessionId = 1;
        this.encoding = 'latin1';
        this.byteorder = 'be';
        this.noChallenge = false;
        this.useOnlySingleSplit = false;
        this.isJc2mp = false;
    }

    run(state) {
        let challenge,packets;

        async.series([
            (c) => {
                if(this.noChallenge) return c();
                this.sendPacket(9,false,false,false,(buffer) => {
                    const reader = this.reader(buffer);
                    challenge = parseInt(reader.string());
                    c();
                });
            },
            (c) => {
                let requestPayload;
                if(this.isJc2mp) {
                    // they completely alter the protocol. because why not.
                    requestPayload = Buffer.from([0xff,0xff,0xff,0x02]);
                } else {
                    requestPayload = Buffer.from([0xff,0xff,0xff,0x01]);
                }

                this.sendPacket(0,challenge,requestPayload,true,(b) => {
                    packets = b;
                    c();
                });
            },
            (c) => {
                // iterate over the received packets
                // the first packet will start off with k/v pairs, followed with data fields
                // the following packets will only have data fields

                state.raw.playerTeamInfo = {};

                for(let iPacket = 0; iPacket < packets.length; iPacket++) {
                    const packet = packets[iPacket];
                    const reader = this.reader(packet);

                    if(this.debug) {
                        console.log("+++"+packet.toString('hex'));
                        console.log(":::"+packet.toString('ascii'));
                    }

                    // Parse raw server key/values

                    if(iPacket === 0) {
                        while(!reader.done()) {
                            const key = reader.string();
                            if(!key) break;
                            let value = reader.string();

                            // reread the next line if we hit the weird ut3 bug
                            if(value === 'p1073741829') value = reader.string();

                            state.raw[key] = value;
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
                            let mode = reader.string();
                            if(mode.charCodeAt(0) <= 2) mode = mode.substring(1);
                            if(!mode) continue;
                            let offset = 0;
                            if(iPacket !== 0 && firstMode) offset = reader.uint(1);
                            reader.skip(1);
                            firstMode = false;

                            const modeSplit = mode.split('_');
                            const modeName = modeSplit[0];
                            const modeType = modeSplit.length > 1 ? modeSplit[1] : 'no_';

                            if(!(modeType in state.raw.playerTeamInfo)) {
                                state.raw.playerTeamInfo[modeType] = [];
                            }
                            const store = state.raw.playerTeamInfo[modeType];

                            while(!reader.done()) {
                                const item = reader.string();
                                if(!item) break;

                                while(store.length <= offset) { store.push({}); }
                                store[offset][modeName] = item;
                                offset++;
                            }
                        }
                    }
                }

                c();
            },

            (c) => {
                // Turn all that raw state into something useful

                if('hostname' in state.raw) state.name = state.raw.hostname;
                else if('servername' in state.raw) state.name = state.raw.servername;
                if('mapname' in state.raw) state.map = state.raw.mapname;
                if(state.raw.password === '1') state.password = true;
                if('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);

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

                this.finish(state);
            }
        ]);
    }

    sendPacket(type,challenge,payload,assemble,c) {
        const challengeLength = (this.noChallenge || challenge === false) ? 0 : 4;
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
        this.udpSend(b,(buffer) => {
            const reader = this.reader(buffer);
            const iType = reader.uint(1);
            if(iType !== type) return;
            const iSessionId = reader.uint(4);
            if(iSessionId !== this.sessionId) return;

            if(!assemble) {
                c(reader.rest());
                return true;
            }
            if(this.useOnlySingleSplit) {
                // has split headers, but they are worthless and only one packet is used
                reader.skip(11);
                c([reader.rest()]);
                return true;
            }

            reader.skip(9); // filler data -- usually set to 'splitnum\0'
            let id = reader.uint(1);
            const last = (id & 0x80);
            id = id & 0x7f;
            if(last) numPackets = id+1;

            reader.skip(1); // "another 'packet number' byte, but isn't understood."

            packets[id] = reader.rest();
            if(this.debug) {
                console.log("Received packet #"+id);
                if(last) console.log("(last)");
            }

            if(!numPackets || Object.keys(packets).length !== numPackets) return;

            // assemble the parts
            const list = [];
            for(let i = 0; i < numPackets; i++) {
                if(!(i in packets)) {
                    this.fatal('Missing packet #'+i);
                    return true;
                }
                list.push(packets[i]);
            }
            c(list);
            return true;
        });
    }
}

module.exports = Gamespy3;
