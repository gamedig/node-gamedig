const Core = require('./core');

class Terraria extends Core {
    async run(state) {
        const json = await this.request({
            url: 'http://'+this.options.address+':'+this.options.port+'/v2/server/status',
            searchParams: {
                players: 'true',
                token: this.options.token
            },
            responseType: 'json'
        });

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
