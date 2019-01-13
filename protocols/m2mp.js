const Core = require('./core');

class M2mp extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
    }

    async run(state) {
        const body = await this.udpSend('M2MP',(buffer) => {
            const reader = this.reader(buffer);
            const header = reader.string({length: 4});
            if (header !== 'M2MP') return;
            return reader.rest();
        });

        const reader = this.reader(body);
        state.name = this.readString(reader);
        state.raw.numplayers = this.readString(reader);
        state.maxplayers = this.readString(reader);
        state.raw.gamemode = this.readString(reader);
        state.password = !!reader.uint(1);
        state.gamePort = this.options.port - 1;

        while(!reader.done()) {
            const name = this.readString(reader);
            if(!name) break;
            state.players.push({
                name:name
            });
        }
    }

    readString(reader) {
        const length = reader.uint(1);
        return reader.string({length:length-1});
    }
}

module.exports = M2mp;
