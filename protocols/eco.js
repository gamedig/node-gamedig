const Core = require('./core');

class Eco extends Core {
    async run(state) {
        if (!this.options.port) this.options.port = 3001;

        const request = await this.request({
            url: `http://${this.options.address}:${this.options.port}/frontpage`,
            responseType: 'json'
        });
        const serverInfo = request.Info;

        state.name = serverInfo.Description;
        state.maxplayers = serverInfo.TotalPlayers;
        state.password = serverInfo.HasPassword;
        state.gamePort = serverInfo.GamePort;
        state.raw = serverInfo;
    }
}

module.exports = Eco;
