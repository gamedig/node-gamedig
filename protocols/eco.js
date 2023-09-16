import Core from './core.js';

export default class eco extends Core {
    async run(state) {
        if (!this.options.port) this.options.port = 3001;

        const serverInfo = (await this.request({
            url: `http://${this.options.address}:${this.options.port}/frontpage`,
            responseType: 'json'
        })).Info;

        state.name = serverInfo.Description;
        state.maxplayers = serverInfo.TotalPlayers;
        state.password = serverInfo.HasPassword;
        state.gamePort = serverInfo.GamePort;
        state.raw = serverInfo;
    }
}
