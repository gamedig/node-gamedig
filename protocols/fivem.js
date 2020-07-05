const Quake2 = require('./quake2');

class FiveM extends Quake2 {
    constructor() {
        super();
        this.sendHeader = 'getinfo xxx';
        this.responseHeader = 'infoResponse';
        this.encoding = 'utf8';
    }

    async run(state) {
        await super.run(state);

        {
            const json = await this.request({
                url: 'http://' + this.options.address + ':' + this.options.port + '/info.json',
                responseType: 'json'
            });
            state.raw.info = json;
        }

        {
            const json = await this.request({
                url: 'http://' + this.options.address + ':' + this.options.port + '/players.json',
                responseType: 'json'
            });
            state.raw.players = json;
            state.players = [];
            for (const player of json) {
                state.players.push({name: player.name, ping: player.ping});
            }
        }
    }
}

module.exports = FiveM;
