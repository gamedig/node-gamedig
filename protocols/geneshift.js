const request = require('request');

class GeneShift extends require('./core') {
    run(state) {
        request({
            uri: 'http://geneshift.net/game/receiveLobby.php',
            timeout: 3000,
        }, (e,r,body) => {
            if(e) return this.fatal('Lobby request error');

            const split = body.split('<br/>');
            let found = false;
            for(const line of split) {
                const fields = line.split('::');
                const ip = fields[2];
                const port = fields[3];
                if(ip === this.options.address && parseInt(port) === this.options.port) {
                    found = fields;
                    break;
                }
            }

            if(!found) return this.fatal('Server not found in list');

            state.raw.countrycode = found[0];
            state.raw.country = found[1];
            state.name = found[4];
            state.map = found[5];
            state.raw.numplayers = parseInt(found[6]);
            state.maxplayers = parseInt(found[7]);
            // fields[8] is unknown?
            state.raw.rules = found[9];
            state.raw.gamemode = parseInt(found[10]);
            state.raw.gangsters = parseInt(found[11]);
            state.raw.cashrate = parseInt(found[12]);
            state.raw.missions = !!parseInt(found[13]);
            state.raw.vehicles = !!parseInt(found[14]);
            state.raw.customweapons = !!parseInt(found[15]);
            state.raw.friendlyfire = !!parseInt(found[16]);
            state.raw.mercs = !!parseInt(found[17]);
            // fields[18] is unknown? listen server?
            state.raw.version = found[19];

            for(let i = 0; i < state.raw.numplayers; i++) {
                state.players.push({});
            }

            this.finish(state);
        });
    }
}

module.exports = GeneShift;
