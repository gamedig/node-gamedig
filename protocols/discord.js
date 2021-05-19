const Core = require('./core');

class Discord extends Core {
    async run(state) {
        const guildId = this.options.guildId;
        if (typeof guildId !== 'string') {
            throw new Error('guildId option must be set when querying discord. Ensure the guildId is a string and not a number.'
                    + " (It's too large of a number for javascript to store without losing precision)");
        }
        this.usedTcp = true;
        const raw = await this.request({
            url: 'https://discordapp.com/api/guilds/' + guildId + '/widget.json',
        });
        const json = JSON.parse(raw);
        state.name = json.name;
        if (json.instant_invite) {
            state.connect = json.instant_invite;
        } else {
            state.connect = 'https://discordapp.com/channels/' + guildId;
        }
        for (const member of json.members) {
            const {username: name, ...rest} = member;
            state.players.push({ name, ...rest });
        }
        delete json.members;
        state.maxplayers = 500000;
        state.raw = json;
    }
}

module.exports = Discord;
