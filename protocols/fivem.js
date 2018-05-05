const request = require('request');

class FiveM extends require('./quake2') {
    constructor() {
        super();
        this.sendHeader = 'getinfo xxx';
        this.responseHeader = 'infoResponse';
        this.encoding = 'utf8';
    }

    finish(state) {
        request({
            uri: 'http://'+this.options.address+':'+this.options.port_query+'/info.json',
            timeout: this.options.socketTimeout
        }, (e,r,body) => {
            if(e) return this.fatal('HTTP error');
            let json;
            try {
                json = JSON.parse(body);
            } catch(e) {
                return this.fatal('Invalid JSON');
            }

            state.raw.info = json;

            request({
                uri: 'http://'+this.options.address+':'+this.options.port_query+'/players.json',
                timeout: this.options.socketTimeout
            }, (e,r,body) => {
                if(e) return this.fatal('HTTP error');
                let json;
                try {
                    json = JSON.parse(body);
                } catch(e) {
                    return this.fatal('Invalid JSON');
                }

                state.raw.players = json;

                state.players = [];
                for (const player of json) {
                    state.players.push({name:player.name, ping:player.ping});
                }

                super.finish(state);
            });
        });
    }
}

module.exports = FiveM;
