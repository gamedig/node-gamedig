const request = require('request');

class Terraria extends require('./core') {
    run(state) {
        request({
            uri: 'http://'+this.options.address+':'+this.options.port_query+'/v2/server/status',
            timeout: this.options.socketTimeout,
            qs: {
                players: 'true',
                token: this.options.token
            }
        }, (e,r,body) => {
            if(e) return this.fatal('HTTP error');
            let json;
            try {
                json = JSON.parse(body);
            } catch(e) {
                return this.fatal('Invalid JSON');
            }

            if(json.status !== 200) return this.fatal('Invalid status');

            for (const one of json.players) {
                state.players.push({name:one.nickname,team:one.team});
            }

            state.name = json.name;
            state.raw.port = json.port;
            state.raw.numplayers = json.playercount;

            this.finish(state);
        });
    }
}

module.exports = Terraria;
