const Core = require('./core');

class Savage2 extends Core {
    constructor() {
        super();
    }

    async run(state) {
        const buffer = await this.udpSend('\x01',b => b);
        const reader = this.reader(buffer);

        reader.skip(12);
        state.name = this.stripColorCodes(reader.string());
        state.players = reader.uint(1);
        state.maxplayers = reader.uint(1);
        state.raw.time = reader.string();
        state.map = reader.string();
        state.raw.nextmap = reader.string();
        state.raw.location = reader.string();
        state.raw.minplayers = reader.uint(1);
        state.raw.gametype = reader.string();
        state.raw.version = reader.string();
        state.raw.minlevel = reader.uint(1);
    }

    stripColorCodes(str) {
        return str.replace(/\^./g,'');
    }
}

module.exports = Savage2;
