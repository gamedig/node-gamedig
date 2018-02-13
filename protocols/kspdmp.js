const request = require('request');

class Kspdmp extends require('./core') {
    run(state) {
        request({
            uri: 'http://'+this.options.address+':'+this.options.port_query,
            timeout: this.options.socketTimeout
        }, (e,r,body) => {
            if(e) return this.fatal('HTTP error');
            let json;
            try {
                json = JSON.parse(body);
            } catch(e) {
                return this.fatal('Invalid JSON');
            }

            for (const one of json.players) {
                state.players.push({name:one.nickname,team:one.team});
            }

            for (const key of Object.keys(json)) {
                state.raw[key] = json[key];
            }
            state.name = json.server_name;
            state.maxplayers = json.max_players;
            if (json.players) {
                const split = json.players.split(', ');
                for (const name of split) {
                    state.players.push({name:name});
                }
            }

            this.finish(state);
        });
    }
}

module.exports = Kspdmp;
