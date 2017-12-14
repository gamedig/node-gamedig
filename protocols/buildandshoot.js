const request = require('request');

class BuildAndShoot extends require('./core') {
    run(state) {
        request({
            uri: 'http://'+this.options.address+':'+this.options.port_query+'/',
            timeout: 3000,
        }, (e,r,body) => {
            if(e) return this.fatal('HTTP error');

            let m;

            m = body.match(/status server for (.*?)\r|\n/);
            if(m) state.name = m[1];

            m = body.match(/Current uptime: (\d+)/);
            if(m) state.raw.uptime = m[1];

            m = body.match(/currently running (.*?) by /);
            if(m) state.map = m[1];

            m = body.match(/Current players: (\d+)\/(\d+)/);
            if(m) {
                state.raw.numplayers = m[1];
                state.maxplayers = m[2];
            }

            m = body.match(/class="playerlist"([^]+?)\/table/);
            if(m) {
                const table = m[1];
                const pre = /<tr>[^]*<td>([^]*)<\/td>[^]*<td>([^]*)<\/td>[^]*<td>([^]*)<\/td>[^]*<td>([^]*)<\/td>/g;
                let pm;
                while(pm = pre.exec(table)) {
                    if(pm[2] === 'Ping') continue;
                    state.players.push({
                        name: pm[1],
                        ping: pm[2],
                        team: pm[3],
                        score: pm[4]
                    });
                }
            }
            /*
            var m = this.options.address.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
            if(m) {
                var o1 = parseInt(m[1]);
                var o2 = parseInt(m[2]);
                var o3 = parseInt(m[3]);
                var o4 = parseInt(m[4]);
                var addr = o1+(o2<<8)+(o3<<16)+(o4<<24);
                state.raw.url = 'aos://'+addr;
            }
            */
            this.finish(state);
        });
    }
}

module.exports = BuildAndShoot;
