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
            ['GetStatus'], // 1
            ['GetPlayerList',10000,0], // 2
            ['GetServerOptions'], // 3
            ['GetCurrentMapInfo'], // 4
            ['GetCurrentGameInfo'], // 5
            ['GetNextMapInfo'] // 6
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
            state.raw.maxspectators = results[3].CurrentMaxSpectators;
            state.map = this.stripColors(results[4].Name);
            state.raw.mapUid = results[4].UId;
            state.raw.gametype = gamemode;
            state.raw.players = results[2];
            state.raw.mapcount = results[5].NbChallenge;
            state.raw.nextmapName = this.stripColors(results[6].Name);
            state.raw.nextmapUid = results[6].UId;

            for (const player of state.raw.players) {
                state.players.push({
                    name:this.stripColors(player.Name || player.NickName)
                });
            }

            this.finish(state);
        });
    }

    stripColors(str) {
        return str.replace(/\$([0-9a-f]{3}|[a-z])/gi,'');
    }

}

module.exports = Nadeo;
