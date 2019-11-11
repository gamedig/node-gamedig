const Core = require('./core'),
    MinecraftVanilla = require('./minecraftvanilla'),
    Gamespy3 = require('./gamespy3');

class Minecraft extends Core {
    constructor() {
        super();
        this.srvRecord = "_minecraft._tcp";
    }
    async run(state) {
        const promises = [];

        const vanillaResolver = new MinecraftVanilla();
        vanillaResolver.options = this.options;
        vanillaResolver.udpSocket = this.udpSocket;
        promises.push((async () => {
            try { return await vanillaResolver.runOnceSafe(); } catch(e) {}
        })());

        const bedrockResolver = new Gamespy3();
        bedrockResolver.options = {
            ...this.options,
            encoding: 'utf8',
        };
        bedrockResolver.udpSocket = this.udpSocket;
        promises.push((async () => {
            try { return await bedrockResolver.runOnceSafe(); } catch(e) {}
        })());

        const [ vanillaState, bedrockState ] = await Promise.all(promises);

        state.raw.vanilla = vanillaState;
        state.raw.bedrock = bedrockState;

        if (!vanillaState && !bedrockState) {
            throw new Error('No protocols succeeded');
        }

        if (vanillaState) {
            try {
                let name = '';
                const description = vanillaState.raw.description;
                if (typeof description === 'string') {
                    name = description;
                }
                if (!name && typeof description === 'object' && description.text) {
                    name = description.text;
                }
                if (!name && typeof description === 'object' && description.extra) {
                    name = description.extra.map(part => part.text).join('');
                }
                state.name = name;
            } catch(e) {}
            if (vanillaState.maxplayers) state.maxplayers = vanillaState.maxplayers;
            if (vanillaState.players) state.players = vanillaState.players;
        }
        if (bedrockState) {
            if (bedrockState.name) state.name = bedrockState.name;
            if (bedrockState.maxplayers) state.maxplayers = bedrockState.maxplayers;
            if (bedrockState.players) state.players = bedrockState.players;
        }
        // remove dupe spaces from name
        state.name = state.name.replace(/\s+/g, ' ');
        // remove color codes from name
        state.name = state.name.replace(/\u00A7./g, '');
    }
}

module.exports = Minecraft;
