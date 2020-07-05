const Core = require('./core'),
    cheerio = require('cheerio');

class BuildAndShoot extends Core {
    async run(state) {
        const body = await this.request({
            url: 'http://'+this.options.address+':'+this.options.port+'/',
        });

        let m;

        m = body.match(/status server for (.*?)\.?[\r\n]/);
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

        m = body.match(/aos:\/\/[0-9]+:[0-9]+/);
        if (m) {
            state.connect = m[0];
        }

        const $ = cheerio.load(body);
        $('#playerlist tbody tr').each((i,tr) => {
            if (!$(tr).find('td').first().attr('colspan')) {
                state.players.push({
                    name: $(tr).find('td').eq(2).text(),
                    ping: $(tr).find('td').eq(3).text().trim(),
                    team: $(tr).find('td').eq(4).text().toLowerCase(),
                    score: parseInt($(tr).find('td').eq(5).text())
                });
            }
        });
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
    }
}

module.exports = BuildAndShoot;
