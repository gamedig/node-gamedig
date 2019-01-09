const Core = require('./core');

class Gamespy1 extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    async run(state) {
        {
            const data = await this.sendPacket('info');
            state.raw = data;
            if ('hostname' in state.raw) state.name = state.raw.hostname;
            if ('mapname' in state.raw) state.map = state.raw.mapname;
            if (this.trueTest(state.raw.password)) state.password = true;
            if ('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);
        }
        {
            const data = await this.sendPacket('rules');
            state.raw.rules = data;
        }
        {
            const data = await this.sendPacket('players');
            const players = {};
            const teams = {};
            for (const ident of Object.keys(data)) {
                const split = ident.split('_');
                let key = split[0];
                const id = split[1];
                let value = data[ident];

                if (key === 'teamname') {
                    teams[id] = value;
                } else {
                    if (!(id in players)) players[id] = {};
                    if (key === 'playername') key = 'name';
                    else if (key === 'team') value = parseInt(value);
                    else if (key === 'score' || key === 'ping' || key === 'deaths') value = parseInt(value);
                    players[id][key] = value;
                }
            }

            state.raw.teams = teams;
            for (const id of Object.keys(players)) {
                state.players.push(players[id]);
            }
        }
    }

    async sendPacket(type) {
        const queryId = '';
        const output = {};
        return await this.udpSend('\\'+type+'\\', buffer => {
            const reader = this.reader(buffer);
            const str = reader.string({length:buffer.length});
            const split = str.split('\\');
            split.shift();
            const data = {};
            while(split.length) {
                const key = split.shift();
                const value = split.shift() || '';
                data[key] = value;
            }
            if(!('queryid' in data)) return;
            if(queryId && data.queryid !== queryId) return;
            for(const i of Object.keys(data)) output[i] = data[i];
            if('final' in output) {
                delete output.final;
                delete output.queryid;
                return output;
            }
        });
    }
}

module.exports = Gamespy1;
