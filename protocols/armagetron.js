const Core = require('./core');

class Armagetron extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    async run(state) {
        const b = Buffer.from([0,0x35,0,0,0,0,0,0x11]);

        const buffer = await this.udpSend(b,b => b);
        const reader = this.reader(buffer);

        reader.skip(6);

        state.gamePort = this.readUInt(reader);
        state.raw.hostname = this.readString(reader);
        state.name = this.stripColorCodes(this.readString(reader));
        state.raw.numplayers = this.readUInt(reader);
        state.raw.versionmin = this.readUInt(reader);
        state.raw.versionmax = this.readUInt(reader);
        state.raw.version = this.readString(reader);
        state.maxplayers = this.readUInt(reader);

        const players = this.readString(reader);
        const list = players.split('\n');
        for(const name of list) {
            if(!name) continue;
            state.players.push({
                name: this.stripColorCodes(name)
            });
        }

        state.raw.options = this.stripColorCodes(this.readString(reader));
        state.raw.uri = this.readString(reader);
        state.raw.globalids = this.readString(reader);
    }

    readUInt(reader) {
        const a = reader.uint(2);
        const b = reader.uint(2);
        return (b<<16) + a;
    }
    readString(reader) {
        const len = reader.uint(2);
        if(!len) return '';

        let out = '';
        for(let i = 0; i < len; i += 2) {
            const hi = reader.uint(1);
            const lo = reader.uint(1);
            if(i+1<len) out += String.fromCharCode(lo);
            if(i+2<len) out += String.fromCharCode(hi);
        }

        return out;
    }
    stripColorCodes(str) {
        return str.replace(/0x[0-9a-f]{6}/g,'');
    }
}

module.exports = Armagetron;
