const async = require('async'),
    Bzip2 = require('compressjs').Bzip2;

class Valve extends require('./core') {
    constructor() {
        super();

        this.options.port = 27015;

        // legacy goldsrc info response -- basically not used by ANYTHING now,
        // as most (all?) goldsrc servers respond with the source info reponse
        // delete in a few years if nothing ends up using it anymore
        this.goldsrcInfo = false;

        // unfortunately, the split format from goldsrc is still around, but we
        // can detect that during the query
        this.goldsrcSplits = false;

        // some mods require a challenge, but don't provide them in the new format
        // at all, use the old dedicated challenge query if needed
        this.legacyChallenge = false;

        // 2006 engines don't pass packet switching size in split packet header
        // while all others do, this need is detected automatically
        this._skipSizeInSplitHeader = false;

        this._challenge = '';
    }

    run(state) {
        async.series([
            (c) => { this.queryInfo(state,c); },
            (c) => { this.queryChallenge(state,c); },
            (c) => { this.queryPlayers(state,c); },
            (c) => { this.queryRules(state,c); },
            (c) => { this.cleanup(state,c); },
            (c) => { this.finish(state); }
        ]);
    }

    queryInfo(state,c) {
        this.sendPacket(
            0x54,false,'Source Engine Query\0',
            this.goldsrcInfo ? 0x6D : 0x49,
            (b) => {
                const reader = this.reader(b);

                if(this.goldsrcInfo) state.raw.address = reader.string();
                else state.raw.protocol = reader.uint(1);

                state.name = reader.string();
                state.map = reader.string();
                state.raw.folder = reader.string();
                state.raw.game = reader.string();
                state.raw.steamappid = reader.uint(2);
                state.raw.numplayers = reader.uint(1);
                state.maxplayers = reader.uint(1);

                if(this.goldsrcInfo) state.raw.protocol = reader.uint(1);
                else state.raw.numbots = reader.uint(1);

                state.raw.listentype = reader.uint(1);
                state.raw.environment = reader.uint(1);
                if(!this.goldsrcInfo) {
                    state.raw.listentype = String.fromCharCode(state.raw.listentype);
                    state.raw.environment = String.fromCharCode(state.raw.environment);
                }

                state.password = !!reader.uint(1);
                if(this.goldsrcInfo) {
                    state.raw.ismod = reader.uint(1);
                    if(state.raw.ismod) {
                        state.raw.modlink = reader.string();
                        state.raw.moddownload = reader.string();
                        reader.skip(1);
                        state.raw.modversion = reader.uint(4);
                        state.raw.modsize = reader.uint(4);
                        state.raw.modtype = reader.uint(1);
                        state.raw.moddll = reader.uint(1);
                    }
                }
                state.raw.secure = reader.uint(1);

                if(this.goldsrcInfo) {
                    state.raw.numbots = reader.uint(1);
                } else {
                    if(state.raw.folder === 'ship') {
                        state.raw.shipmode = reader.uint(1);
                        state.raw.shipwitnesses = reader.uint(1);
                        state.raw.shipduration = reader.uint(1);
                    }
                    state.raw.version = reader.string();
                    const extraFlag = reader.uint(1);
                    if(extraFlag & 0x80) state.raw.port = reader.uint(2);
                    if(extraFlag & 0x10) state.raw.steamid = reader.uint(8);
                    if(extraFlag & 0x40) {
                        state.raw.sourcetvport = reader.uint(2);
                        state.raw.sourcetvname = reader.string();
                    }
                    if(extraFlag & 0x20) state.raw.tags = reader.string();
                    if(extraFlag & 0x01) state.raw.gameid = reader.uint(8);
                }

                // from https://developer.valvesoftware.com/wiki/Server_queries
                if(
                    state.raw.protocol === 7 && (
                        state.raw.steamappid === 215
                        || state.raw.steamappid === 17550
                        || state.raw.steamappid === 17700
                        || state.raw.steamappid === 240
                    )
                ) {
                    this._skipSizeInSplitHeader = true;
                }
                if(this.debug) {
                    console.log("STEAM APPID: "+state.raw.steamappid);
                    console.log("PROTOCOL: "+state.raw.protocol);
                }
                if(state.raw.protocol === 48) {
                    if(this.debug) console.log("GOLDSRC DETECTED - USING MODIFIED SPLIT FORMAT");
                    this.goldsrcSplits = true;
                }

                c();
            }
        );
    }

    queryChallenge(state,c) {
        if(this.legacyChallenge) {
            this.sendPacket(0x57,false,false,0x41,(b) => {
                // sendPacket will catch the response packet and
                // save the challenge for us
                c();
            });
        } else {
            c();
        }
    }

    queryPlayers(state,c) {
        state.raw.players = [];
        this.sendPacket(0x55,true,false,0x44,(b) => {
            const reader = this.reader(b);
            const num = reader.uint(1);
            for(let i = 0; i < num; i++) {
                reader.skip(1);
                const name = reader.string();
                const score = reader.int(4);
                const time = reader.float();

                if(this.debug) console.log("Found player: "+name+" "+score+" "+time);

                // connecting players don't count as players.
                if(!name) continue;

                // CSGO sometimes adds a bot named 'Max Players' if host_players_show is not 2
                if (state.raw.steamappid === 730 && name === 'Max Players') continue;

                state.raw.players.push({
                    name:name, score:score, time:time
                });
            }

            c();
        }, () => {
            // CSGO doesn't even respond sometimes if host_players_show is not 2
            // Ignore timeouts in only this case
            if (state.raw.steamappid === 730) {
                c();
                return true;
            }
        });
    }

    queryRules(state,c) {
        state.raw.rules = {};
        this.sendPacket(0x56,true,false,0x45,(b) => {
            const reader = this.reader(b);
            const num = reader.uint(2);
            for(let i = 0; i < num; i++) {
                const key = reader.string();
                const value = reader.string();
                state.raw.rules[key] = value;
            }
            c();
        }, () => {
            // no rules were returned after timeout --
            // the server probably has them disabled
            // ignore the timeout
            c();
            return true;
        });
    }

    cleanup(state,c) {
        // Battalion 1944 puts its info into rules fields for some reason
        if ('bat_name_s' in state.raw.rules) {
            state.name = state.raw.rules.bat_name_s;
            delete state.raw.rules.bat_name_s;
            if ('bat_player_count_s' in state.raw.rules) {
                state.raw.numplayers = parseInt(state.raw.rules.bat_player_count_s);
                delete state.raw.rules.bat_player_count_s;
            }
            if ('bat_max_players_i' in state.raw.rules) {
                state.maxplayers = parseInt(state.raw.rules.bat_max_players_i);
                delete state.raw.rules.bat_max_players_i;
            }
            if ('bat_has_password_s' in state.raw.rules) {
                state.password = state.raw.rules.bat_has_password_s === 'Y';
                delete state.raw.rules.bat_has_password_s;
            }
            // apparently map is already right, and this var is often wrong
            delete state.raw.rules.bat_map_s;
        }

        // Organize players / hidden players into player / bot arrays
        const botProbability = (p) => {
            if (p.time === -1) return Number.MAX_VALUE;
            return p.time;
        };
        const sortedPlayers = state.raw.players.sort((a,b) => {
            return botProbability(a) - botProbability(b);
        });
        delete state.raw.players;
        const numBots = state.raw.numbots;
        const numPlayers = state.raw.numplayers - numBots;
        while(state.bots.length < numBots) {
            if (sortedPlayers.length) state.bots.push(sortedPlayers.pop());
            else state.bots.push({});
        }
        while(state.players.length < numPlayers || sortedPlayers.length) {
            if (sortedPlayers.length) state.players.push(sortedPlayers.pop());
            else state.players.push({});
        }

        c();
    }

    sendPacket(type,sendChallenge,payload,expect,callback,ontimeout) {
        const packetStorage = {};

        const receivedFull = (reader) => {
            const type = reader.uint(1);

            if(type === 0x41) {
                const key = reader.uint(4);

                if(this.debug) console.log('Received challenge key: ' + key);

                if(this._challenge !== key) {
                    this._challenge = key;
                    if(sendChallenge) {
                        if (this.debug) console.log('Restarting query');
                        send();
                        return true;
                    }
                }

                return;
            }

            if(this.debug) console.log("Received "+type.toString(16)+" expected "+expect.toString(16));
            if(type !== expect) return;
            callback(reader.rest());
            return true;
        };

        const receivedOne = (buffer) => {
            const reader = this.reader(buffer);

            const header = reader.int(4);
            if(header === -1) {
                // full package
                if(this.debug) console.log("Received full packet");
                return receivedFull(reader);
            }
            if(header === -2) {
                // partial package
                const uid = reader.uint(4);
                if(!(uid in packetStorage)) packetStorage[uid] = {};
                const packets = packetStorage[uid];

                let bzip = false;
                if(!this.goldsrcSplits && uid & 0x80000000) bzip = true;

                let packetNum,payload,numPackets;
                if(this.goldsrcSplits) {
                    packetNum = reader.uint(1);
                    numPackets = packetNum & 0x0f;
                    packetNum = (packetNum & 0xf0) >> 4;
                    payload = reader.rest();
                } else {
                    numPackets = reader.uint(1);
                    packetNum = reader.uint(1);
                    if(!this._skipSizeInSplitHeader) reader.skip(2);
                    if(packetNum === 0 && bzip) reader.skip(8);
                    payload = reader.rest();
                }

                packets[packetNum] = payload;

                if(this.debug) {
                    console.log("Received partial packet uid:"+uid+" num:"+packetNum);
                    console.log("Received "+Object.keys(packets).length+'/'+numPackets+" packets for this UID");
                }

                if(Object.keys(packets).length !== numPackets) return;

                // assemble the parts
                const list = [];
                for(let i = 0; i < numPackets; i++) {
                    if(!(i in packets)) {
                        this.fatal('Missing packet #'+i);
                        return true;
                    }
                    list.push(packets[i]);
                }

                let assembled = Buffer.concat(list);
                if(bzip) {
                    if(this.debug) console.log("BZIP DETECTED - Extracing packet...");
                    try {
                        assembled = Buffer.from(Bzip2.decompressFile(assembled));
                    } catch(e) {
                        this.fatal('Invalid bzip packet');
                        return true;
                    }
                }
                const assembledReader = this.reader(assembled);
                assembledReader.skip(4); // header
                return receivedFull(assembledReader);
            }
        };

        const send = (c) => {
            if(typeof payload === 'string') payload = Buffer.from(payload,'binary');
            const challengeLength = sendChallenge ? 4 : 0;
            const payloadLength = payload ? payload.length : 0;

            const b = Buffer.alloc(5 + challengeLength + payloadLength);
            b.writeInt32LE(-1, 0);
            b.writeUInt8(type, 4);

            if(sendChallenge) {
                let challenge = this._challenge;
                if(!challenge) challenge = 0xffffffff;
                if(this.byteorder === 'le') b.writeUInt32LE(challenge, 5);
                else b.writeUInt32BE(challenge, 5);
            }
            if(payloadLength) payload.copy(b, 5+challengeLength);

            this.udpSend(b,receivedOne,ontimeout);
        };

        send();
    }
}

module.exports = Valve;
