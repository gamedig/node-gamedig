const Core = require('./core');

class Terraria extends Core {
    async run(state) {
        const body = await this.request({
            uri: 'http://'+this.options.address+':'+this.options.port+'/v2/server/status',
            qs: {
                players: 'true',
                token: this.options.token
            }
        });

        const json = JSON.parse(body);
        if(json.status !== '200') throw new Error('Invalid status');

        for (const one of json.players) {
            state.players.push({name:one.nickname,team:one.team});
        }

        state.name = json.name;
        state.gamePort = json.port;
        state.raw.numplayers = json.playercount;
    }
}

module.exports = Terraria;
