const async = require('async');

class Gamespy1 extends require('./core') {
    constructor() {
        super();
        this.sessionId = 1;
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    run(state) {
        async.series([
            (c) => {
                this.sendPacket('info', (data) => {
                    state.raw = data;
                    if('hostname' in state.raw) state.name = state.raw.hostname;
                    if('mapname' in state.raw) state.map = state.raw.mapname;
                    if(this.trueTest(state.raw.password)) state.password = true;
                    if('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);
                    c();
                });
            },
            (c) => {
                this.sendPacket('rules', (data) => {
                    state.raw.rules = data;
                    c();
                });
            },
            (c) => {
                this.sendPacket('players', (data) => {
                    const players = {};
                    const teams = {};
                    for(const ident of Object.keys(data)) {
                        const split = ident.split('_');
                        let key = split[0];
                        const id = split[1];
                        let value = data[ident];

                        if(key === 'teamname') {
                            teams[id] = value;
                        } else {
                            if(!(id in players)) players[id] = {};
                            if(key === 'playername') key = 'name';
                            else if(key === 'team') value = parseInt(value);
                            else if(key === 'score' || key === 'ping' || key === 'deaths') value = parseInt(value);
                            players[id][key] = value;
                        }
                    }

                    state.raw.teams = teams;
                    for(const id of Object.keys(players)) {
                        state.players.push(players[id]);
                    }
                    this.finish(state);
                });
            }
        ]);

    }

    sendPacket(type,callback) {
        const queryId = '';
        const output = {};
        this.udpSend('\\'+type+'\\', (buffer) => {
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
                callback(output);
                return true;
            }
        });
    }
}

module.exports = Gamespy1;
