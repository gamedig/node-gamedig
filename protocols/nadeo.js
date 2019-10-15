const gbxremote = require('gbxremote'),
    Core = require('./core'),
    Promises = require('../lib/Promises');

class Nadeo extends Core {
    async run(state) {
        await this.withClient(async client => {
            const start = Date.now();
            await this.query(client, 'Authenticate', this.options.login, this.options.password);
            this.registerRtt(Date.now()-start);

            //const data = this.methodCall(client, 'GetStatus');

            {
                const results = await this.query(client, 'GetServerOptions');
                state.name = this.stripColors(results.Name);
                state.password = (results.Password !== 'No password');
                state.maxplayers = results.CurrentMaxPlayers;
                state.raw.maxspectators = results.CurrentMaxSpectators;
            }

            {
                const results = await this.query(client, 'GetCurrentMapInfo');
                state.map = this.stripColors(results.Name);
                state.raw.mapUid = results.UId;
            }

            {
                const results = await this.query(client, 'GetCurrentGameInfo');
                let gamemode = '';
                const igm = results.GameMode;
                if(igm === 0) gamemode="Rounds";
                if(igm === 1) gamemode="Time Attack";
                if(igm === 2) gamemode="Team";
                if(igm === 3) gamemode="Laps";
                if(igm === 4) gamemode="Stunts";
                if(igm === 5) gamemode="Cup";
                state.raw.gametype = gamemode;
                state.raw.mapcount = results.NbChallenge;
            }

            {
                const results = await this.query(client, 'GetNextMapInfo');
                state.raw.nextmapName = this.stripColors(results.Name);
                state.raw.nextmapUid = results.UId;
            }

            if (this.options.port === 5000) {
                state.gamePort = 2350;
            }

            state.raw.players = await this.query(client, 'GetPlayerList', 10000, 0);
            for (const player of state.raw.players) {
                state.players.push({
                    name:this.stripColors(player.Name || player.NickName)
                });
            }
        });
    }

    async withClient(fn) {
        const socket = new gbxremote.Client(this.options.port, this.options.host);
        try {
            const connectPromise = socket.connect();
            const timeoutPromise = Promises.createTimeout(this.options.socketTimeout, 'GBX Remote Opening');
            await Promise.race([connectPromise, timeoutPromise, this.abortedPromise]);
            return await fn(socket);
        } finally {
            socket.terminate();
        }
    }

    async query(client, ...cmdset) {
        const cmd = cmdset[0];
        const params = cmdset.slice(1);

        const sentPromise = client.query(cmd, params);
        const timeoutPromise = Promises.createTimeout(this.options.socketTimeout, 'GBX Method Call');
        return await Promise.race([sentPromise, timeoutPromise, this.abortedPromise]);
    }

    stripColors(str) {
        return str.replace(/\$([0-9a-f]{3}|[a-z])/gi,'');
    }

}

module.exports = Nadeo;
