class MumblePing extends require('./core') {
    constructor() {
        super();
        this.byteorder = 'be';
    }

    run(state) {
        this.udpSend('\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08', (buffer) => {
            if(buffer.length < 24) return;
            const reader = this.reader(buffer);
            reader.skip(1);
            state.raw.versionMajor = reader.uint(1);
            state.raw.versionMinor = reader.uint(1);
            state.raw.versionPatch = reader.uint(1);
            reader.skip(8);
            state.raw.numplayers = reader.uint(4);
            state.maxplayers = reader.uint(4);
            state.raw.allowedbandwidth = reader.uint(4);
            for(let i = 0; i < state.raw.numplayers; i++) {
                state.players.push({});
            }
            this.finish(state);
            return true;
        });
    }
}

module.exports = MumblePing;
