const Core = require('./core');

class Samp extends Core {
    constructor() {
        super();
        this.encoding = 'win1252';
    }

    async run(state) {
        // read info
        {
            const reader = await this.sendPacket('i');
            state.password = !!reader.uint(1);
            state.raw.numplayers = reader.uint(2);
            state.maxplayers = reader.uint(2);
            state.name = this.readString(reader,4);
            state.raw.gamemode = this.readString(reader,4);
            this.map = this.readString(reader,4);
        }

        // read rules
        {
            const reader = await this.sendPacket('r');
            const ruleCount = reader.uint(2);
            state.raw.rules = {};
            for(let i = 0; i < ruleCount; i++) {
                const key = this.readString(reader,1);
                const value = this.readString(reader,1);
                state.raw.rules[key] = value;
            }
            if('mapname' in state.raw.rules)
                state.map = state.raw.rules.mapname;
        }

        // read players
        {
            const reader = await this.sendPacket('d', true);
            if (reader !== null) {
                const playerCount = reader.uint(2);
                for(let i = 0; i < playerCount; i++) {
                    const player = {};
                    player.id = reader.uint(1);
                    player.name = this.readString(reader,1);
                    player.score = reader.int(4);
                    player.ping = reader.uint(4);
                    state.players.push(player);
                }
            } else {
                for(let i = 0; i < state.raw.numplayers; i++) {
                    state.players.push({});
                }
            }
        }
    }
    readString(reader,lenBytes) {
        const length = reader.uint(lenBytes);
        if(!length) return '';
        return reader.string({length:length});
    }
    async sendPacket(type,allowTimeout) {
        const outBuffer = Buffer.alloc(11);
        outBuffer.writeUInt32BE(0x53414D50,0);
        const ipSplit = this.options.address.split('.');
        outBuffer.writeUInt8(parseInt(ipSplit[0]),4);
        outBuffer.writeUInt8(parseInt(ipSplit[1]),5);
        outBuffer.writeUInt8(parseInt(ipSplit[2]),6);
        outBuffer.writeUInt8(parseInt(ipSplit[3]),7);
        outBuffer.writeUInt16LE(this.options.port,8);
        outBuffer.writeUInt8(type.charCodeAt(0),10);

        return await this.udpSend(
            outBuffer,
            (buffer) => {
                const reader = this.reader(buffer);
                for(let i = 0; i < outBuffer.length; i++) {
                    if(outBuffer.readUInt8(i) !== reader.uint(1)) return;
                }
                return reader;
            },
            () => {
                if(allowTimeout) {
                    return null;
                }
            }
        );
    }
}

module.exports = Samp;
