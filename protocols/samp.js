const async = require('async');

class Samp extends require('./core') {
    run(state) {
        async.series([
            (c) => {
                this.sendPacket('i',(reader) => {
                    state.password = !!reader.uint(1);
                    state.raw.numplayers = reader.uint(2);
                    state.maxplayers = reader.uint(2);
                    state.name = this.readString(reader,4);
                    state.raw.gamemode = this.readString(reader,4);
                    this.map = this.readString(reader,4);
                    c();
                });
            },
            (c) => {
                this.sendPacket('r',(reader) => {
                    const ruleCount = reader.uint(2);
                    state.raw.rules = {};
                    for(let i = 0; i < ruleCount; i++) {
                        const key = this.readString(reader,1);
                        const value = this.readString(reader,1);
                        state.raw.rules[key] = value;
                    }
                    if('mapname' in state.raw.rules)
                        state.map = state.raw.rules.mapname;
                    c();
                });
            },
            (c) => {
                this.sendPacket('d',(reader) => {
                    const playerCount = reader.uint(2);
                    for(let i = 0; i < playerCount; i++) {
                        const player = {};
                        player.id = reader.uint(1);
                        player.name = this.readString(reader,1);
                        player.score = reader.int(4);
                        player.ping = reader.uint(4);
                        state.players.push(player);
                    }
                    c();
                },() => {
                    for(let i = 0; i < state.raw.numplayers; i++) {
                        state.players.push({});
                    }
                    c();
                });
            },
            (c) => {
                this.finish(state);
            }
        ]);
    }
    readString(reader,lenBytes) {
        const length = reader.uint(lenBytes);
        if(!length) return '';
        const string = reader.string({length:length});
        return string;
    }
    sendPacket(type,onresponse,ontimeout) {
        const outbuffer = Buffer.alloc(11);
        outbuffer.writeUInt32BE(0x53414D50,0);
        const ipSplit = this.options.address.split('.');
        outbuffer.writeUInt8(parseInt(ipSplit[0]),4);
        outbuffer.writeUInt8(parseInt(ipSplit[1]),5);
        outbuffer.writeUInt8(parseInt(ipSplit[2]),6);
        outbuffer.writeUInt8(parseInt(ipSplit[3]),7);
        outbuffer.writeUInt16LE(this.options.port,8);
        outbuffer.writeUInt8(type.charCodeAt(0),10);

        this.udpSend(outbuffer,(buffer) => {
            const reader = this.reader(buffer);
            for(let i = 0; i < outbuffer.length; i++) {
                if(outbuffer.readUInt8(i) !== reader.uint(1)) return;
            }
            onresponse(reader);
            return true;
        },() => {
            if(ontimeout) {
                ontimeout();
                return true;
            }
        });
    }
}

module.exports = Samp;
