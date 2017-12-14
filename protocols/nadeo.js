const gbxremote = require('gbxremote'),
    async = require('async');

class Nadeo extends require('./core') {
    constructor() {
        super();
        this.options.port = 2350;
        this.options.port_query = 5000;
        this.gbxclient = false;
    }

    reset() {
        super.reset();
        if(this.gbxclient) {
            this.gbxclient.terminate();
            this.gbxclient = false;
        }
    }

    run(state) {
        const cmds = [
            ['Connect'],
            ['Authenticate', this.options.login,this.options.password],
            ['GetStatus'],
            ['GetPlayerList',500,0],
            ['GetServerOptions'],
            ['GetCurrentChallengeInfo'],
            ['GetCurrentGameInfo']
        ];
        const results = [];

        async.eachSeries(cmds, (cmdset,c) => {
            const cmd = cmdset[0];
            const params = cmdset.slice(1);

            if(cmd === 'Connect') {
                const client = this.gbxclient = gbxremote.createClient(this.options.port_query,this.options.host, (err) => {
                    if(err) return this.fatal('GBX error '+JSON.stringify(err));
                    c();
                });
                client.on('error',() => {});
            } else {
                this.gbxclient.methodCall(cmd, params, (err, value) => {
                    if(err) return this.fatal('XMLRPC error '+JSON.stringify(err));
                    results.push(value);
                    c();
                });
            }
        }, () => {
            let gamemode = '';
            const igm = results[5].GameMode;
            if(igm === 0) gamemode="Rounds";
            if(igm === 1) gamemode="Time Attack";
            if(igm === 2) gamemode="Team";
            if(igm === 3) gamemode="Laps";
            if(igm === 4) gamemode="Stunts";
            if(igm === 5) gamemode="Cup";

            state.name = this.stripColors(results[3].Name);
            state.password = (results[3].Password !== 'No password');
            state.maxplayers = results[3].CurrentMaxPlayers;
            state.map = this.stripColors(results[4].Name);
            state.raw.gametype = gamemode;

            for (const player of results[2]) {
                state.players.push({name:this.stripColors(player.Name)});
            }

            this.finish(state);
        });
    }

    stripColors(str) {
        return str.replace(/\$([0-9a-f][^\$]?[^\$]?|[^\$]?)/g,'');
    }
}

module.exports = Nadeo;
