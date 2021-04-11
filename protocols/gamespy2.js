const Core = require('./core');

class Gamespy2 extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.byteorder = 'be';
    }

    async run(state) {
        // Parse info
        {
            const body = await this.sendPacket([0xff, 0, 0]);
            const reader = this.reader(body);
            while (!reader.done()) {
                const key = reader.string();
                const value = reader.string();
                if (!key) break;
                state.raw[key] = value;
            }
            if ('hostname' in state.raw) state.name = state.raw.hostname;
            if ('mapname' in state.raw) state.map = state.raw.mapname;
            if (this.trueTest(state.raw.password)) state.password = true;
            if ('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);
            if ('hostport' in state.raw) state.gamePort = parseInt(state.raw.hostport);
        }

        // Parse players
        {
            const body = await this.sendPacket([0, 0xff, 0]);
            const reader = this.reader(body);
            for (const rawPlayer of this.readFieldData(reader)) {
                state.players.push(rawPlayer);
            }
        }

        // Parse teams
        {
            const body = await this.sendPacket([0, 0, 0xff]);
            const reader = this.reader(body);
            state.raw.teams = this.readFieldData(reader);
        }

        // Special case for america's army 1 and 2
        // both use gamename = "armygame"
        if (state.raw.gamename === 'armygame') {
            const stripColor = (str) => {
                // uses unreal 2 color codes
                return str.replace(/\x1b...|[\x00-\x1a]/g,'');
            };
            state.name = stripColor(state.name);
            state.map = stripColor(state.map);
            for(const key of Object.keys(state.raw)) {
                if(typeof state.raw[key] === 'string') {
                    state.raw[key] = stripColor(state.raw[key]);
                }
            }
            for(const player of state.players) {
                if(!('name' in player)) continue;
                player.name = stripColor(player.name);
            }
        }
    }

    async sendPacket(type) {
        const request = Buffer.concat([
            Buffer.from([0xfe,0xfd,0x00]), // gamespy2
            Buffer.from([0x00,0x00,0x00,0x01]), // ping ID
            Buffer.from(type)
        ]);
        return await this.udpSend(request, buffer => {
            const reader = this.reader(buffer);
            const header = reader.uint(1);
            if (header !== 0) return;
            const pingId = reader.uint(4);
            if (pingId !== 1) return;
            return reader.rest();
        });
    }

    readFieldData(reader) {
        const zero = reader.uint(1); // always 0
        const count = reader.uint(1); // number of rows in this data

        // some games omit the count byte entirely if it's 0 or at random (like americas army)
        // Luckily, count should always be <64, and ascii characters will typically be >64,
        // so we can detect this.
        if (count > 64) {
            reader.skip(-1);
            this.debugLog("Detected missing count byte, rewinding by 1");
        } else {
            this.debugLog("Detected row count: " + count);
        }

        this.debugLog(() => "Reading fields, starting at: "+reader.rest());

        const fields = [];
        while(!reader.done()) {
            let field = reader.string();
            if(!field) break;
            fields.push(field);
            this.debugLog("field:"+field);
        }

        if (!fields.length) return [];

        const units = [];
        outer: while(!reader.done()) {
            const unit = {};
            for(let iField = 0; iField < fields.length; iField++) {
                let key = fields[iField];
                let value = reader.string();
                if(!value && iField === 0) break outer;
                this.debugLog("value:"+value);
                if(key === 'player_') key = 'name';
                else if(key === 'score_') key = 'score';
                else if(key === 'deaths_') key = 'deaths';
                else if(key === 'ping_') key = 'ping';
                else if(key === 'team_') key = 'team';
                else if(key === 'kills_') key = 'kills';
                else if(key === 'team_t') key = 'name';
                else if(key === 'tickets_t') key = 'tickets';

                if(
                    key === 'score' || key === 'deaths'
                    || key === 'ping' || key === 'team'
                    || key === 'kills' || key === 'tickets'
                ) {
                    if(value === '') continue;
                    value = parseInt(value);
                }

                unit[key] = value;
            }
            units.push(unit);
        }

        return units;
    }
}

module.exports = Gamespy2;
