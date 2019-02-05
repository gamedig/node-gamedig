const Core = require('./core');

class Cs2d extends Core {
    async run(state) {
        {
            const reader = await this.sendQuery(
                Buffer.from('\x01\x00\x03\x10\x21\xFB\x01\x75\x00', 'binary'),
                Buffer.from('\x01\x00\xfb\x01', 'binary')
            );
            const flags = reader.uint(1);
            state.raw.flags = flags;
            state.password = this.readFlag(flags, 0);
            state.raw.registeredOnly = this.readFlag(flags, 1);
            state.raw.fogOfWar = this.readFlag(flags, 2);
            state.raw.friendlyFire = this.readFlag(flags, 3);
            state.raw.botsEnabled = this.readFlag(flags, 5);
            state.raw.luaScripts = this.readFlag(flags, 6);
            state.name = this.readString(reader);
            state.map = this.readString(reader);
            state.raw.numplayers = reader.uint(1);
            state.maxplayers = reader.uint(1);
            state.raw.gamemode = reader.uint(1);
            if (state.raw.botsEnabled) {
                state.raw.numbots = reader.uint(1);
            } else {
                state.raw.numbots = 0;
            }
        }

        {
            const reader = await this.sendQuery(
                Buffer.from('\x01\x00\xFB\x05', 'binary'),
                Buffer.from('\x01\x00\xFB\x05', 'binary')
            );
            state.raw.numplayers2 = reader.uint(1);
            while(!reader.done()) {
                const player = {};
                player.id = reader.uint(1);
                player.name = this.readString(reader);
                player.team = reader.uint(1);
                player.score = reader.uint(4);
                player.deaths = reader.uint(4);
                if (state.bots.length < state.raw.numbots) {
                    state.bots.push(player);
                } else {
                    state.players.push(player);
                }
            }
        }
    }

    async sendQuery(request, expectedHeader) {
        // Send multiple copies of the request packet, because cs2d likes to just ignore them randomly
        await this.udpSend(request);
        await this.udpSend(request);
        return await this.udpSend(request, (buffer) => {
            const reader = this.reader(buffer);
            const header = reader.part(4);
            if (!header.equals(expectedHeader)) return;
            return reader;
        });
    }

    readFlag(flags, offset) {
        return !!(flags & (1 << offset));
    }

    readString(reader) {
        return reader.pascalString(1);
    }
}

module.exports = Cs2d;
