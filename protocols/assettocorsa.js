const Core = require('./core');

class AssettoCorsa extends Core {
    async run(state) {
        const serverInfo = await this.request({
            url: `http://${this.options.address}:${this.options.port}/INFO`,
            responseType: 'json'
        });
        const carInfo = await this.request({
            url: `http://${this.options.address}:${this.options.port}/JSON|${parseInt(Math.random() * 999999999999999, 10)}`,
            responseType: 'json'
        });

        if (!serverInfo || !carInfo || !carInfo.Cars) {
            throw new Error('Query not successful');
        }
        
        state.maxplayers = serverInfo.maxclients;
        state.name = serverInfo.name;
        state.map = serverInfo.track;
        state.password = serverInfo.pass;
        state.gamePort = serverInfo.port;
        state.raw.carInfo = carInfo.Cars;
        state.raw.serverInfo = serverInfo;

        state.players = carInfo.Cars.reduce((r, e) => {
            if (e.IsConnected) {
                r.push({
                    name: e.DriverName,
                    car: e.Model,
                    skin: e.Skin,
                    nation: e.DriverNation,
                    team: e.DriverTeam
                });
            }
            return r;
        }, state.players);
    }
}

module.exports = AssettoCorsa;