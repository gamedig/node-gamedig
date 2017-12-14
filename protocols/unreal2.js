const async = require('async');

class Unreal2 extends require('./core') {
    constructor() {
        super();
        this.encoding = 'latin1';
    }
    run(state) {
        async.series([
            (c) => {
                this.sendPacket(0,true,(b) => {
                    const reader = this.reader(b);
                    state.raw.serverid = reader.uint(4);
                    state.raw.ip = this.readUnrealString(reader);
                    state.raw.port = reader.uint(4);
                    state.raw.queryport = reader.uint(4);
                    state.name = this.readUnrealString(reader,true);
                    state.map = this.readUnrealString(reader,true);
                    state.raw.gametype = this.readUnrealString(reader,true);
                    state.raw.numplayers = reader.uint(4);
                    state.maxplayers = reader.uint(4);
                    this.readExtraInfo(reader,state);

                    c();
                });
            },
            (c) => {
                this.sendPacket(1,true,(b) => {
                    const reader = this.reader(b);
                    state.raw.mutators = [];
                    state.raw.rules = {};
                    while(!reader.done()) {
                        const key = this.readUnrealString(reader,true);
                        const value = this.readUnrealString(reader,true);
                        if(key === 'Mutator') state.raw.mutators.push(value);
                        else state.raw.rules[key] = value;
                    }

                    if('GamePassword' in state.raw.rules)
                        state.password = state.raw.rules.GamePassword !== 'True';

                    c();
                });
            },
            (c) => {
                this.sendPacket(2,false,(b) => {
                    const reader = this.reader(b);

                    while(!reader.done()) {
                        const player = {};
                        player.id = reader.uint(4);
                        if(!player.id) break;
                        if(player.id === 0) {
                            // Unreal2XMP Player (ID is always 0)
                            reader.skip(4);
                        }
                        player.name = this.readUnrealString(reader,true);
                        player.ping = reader.uint(4);
                        player.score = reader.int(4);
                        reader.skip(4); // stats ID

                        // Extra data for Unreal2XMP players
                        if(player.id === 0) {
                            const count = reader.uint(1);
                            for(let iField = 0; iField < count; iField++) {
                                const key = this.readUnrealString(reader,true);
                                const value = this.readUnrealString(reader,true);
                                player[key] = value;
                            }
                        }

                        if(player.id === 0 && player.name === 'Player') {
                            // these show up in ut2004 queries, but aren't real
                            // not even really sure why they're there
                            continue;
                        }

                        (player.ping ? state.players : state.bots).push(player);
                    }
                    c();
                });
            },
            (c) => {
                this.finish(state);
            }
        ]);
    }
    readExtraInfo(reader,state) {
        if(this.debug) {
            console.log("UNREAL2 EXTRA INFO:");
            console.log(reader.uint(4));
            console.log(reader.uint(4));
            console.log(reader.uint(4));
            console.log(reader.uint(4));
            console.log(reader.buffer.slice(reader.i));
        }
    }
    readUnrealString(reader, stripColor) {
        let length = reader.uint(1);
        let out;
        if(length < 0x80) {
            //out = reader.string({length:length});
            out = '';
            if(length > 0) out = reader.string();
        } else {
            length = (length&0x7f)*2;
            if(this.debug) {
                console.log("UCS2 STRING");
                console.log(length,reader.buffer.slice(reader.i,reader.i+length));
            }
            out = reader.string({encoding:'ucs2',length:length});
        }

        if(out.charCodeAt(out.length-1) === 0)
            out = out.substring(0,out.length-1);

        if(stripColor)
            out = out.replace(/\x1b...|[\x00-\x1a]/g,'');

        return out;
    }
    sendPacket(type,required,callback) {
        const outbuffer = Buffer.from([0x79,0,0,0,type]);

        const packets = [];
        this.udpSend(outbuffer,(buffer) => {
            const reader = this.reader(buffer);
            const header = reader.uint(4);
            const iType = reader.uint(1);
            if(iType !== type) return;
            packets.push(reader.rest());
        }, () => {
            if(!packets.length && required) return;
            callback(Buffer.concat(packets));
            return true;
        });
    }
}

module.exports = Unreal2;
