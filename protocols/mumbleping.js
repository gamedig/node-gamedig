const Core = require('./core');

class MumblePing extends Core {
    constructor() {
        super();
        this.byteorder = 'be';
    }

    async run(state) {
        const data = await this.udpSend('\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08', (buffer) => {
            if (buffer.length >= 24) return buffer;
        });

        const reader = this.reader(data);
        reader.skip(1);
        state.raw.versionMajor = reader.uint(1);
        state.raw.versionMinor = reader.uint(1);
        state.raw.versionPatch = reader.uint(1);
        reader.skip(8);
        state.players = reader.uint(4);
        state.maxplayers = reader.uint(4);
        state.raw.allowedbandwidth = reader.uint(4);
    }
}

module.exports = MumblePing;
