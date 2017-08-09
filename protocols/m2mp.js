class M2mp extends require('./core') {
    constructor() {
        super();
        this.encoding = 'latin1';
    }

    run(state) {
        this.udpSend('M2MP',(buffer) => {
            const reader = this.reader(buffer);

            const header = reader.string({length:4});
            if(header !== 'M2MP') return;

            state.name = this.readString(reader);
            state.raw.numplayers = this.readString(reader);
            state.maxplayers = this.readString(reader);
            state.raw.gamemode = this.readString(reader);
            state.password = !!reader.uint(1);

            while(!reader.done()) {
                const name = this.readString(reader);
                if(!name) break;
                state.players.push({
                    name:name
                });
            }

            this.finish(state);
            return true;
        });
    }

    readString(reader) {
        const length = reader.uint(1);
        return reader.string({length:length-1});
    }
}

module.exports = M2mp;
