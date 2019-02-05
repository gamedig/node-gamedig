const Core = require('./core');

class Battlefield extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
    }

    async run(state) {
        await this.withTcp(async socket => {
            {
                const data = await this.query(socket, ['serverInfo']);
                state.name = data.shift();
                state.raw.numplayers = parseInt(data.shift());
                state.maxplayers = parseInt(data.shift());
                state.raw.gametype = data.shift();
                state.map = data.shift();
                state.raw.roundsplayed = parseInt(data.shift());
                state.raw.roundstotal = parseInt(data.shift());

                const teamCount = data.shift();
                state.raw.teams = [];
                for (let i = 0; i < teamCount; i++) {
                    const tickets = parseFloat(data.shift());
                    state.raw.teams.push({
                        tickets: tickets
                    });
                }

                state.raw.targetscore = parseInt(data.shift());
                state.raw.status = data.shift();

                // Seems like the fields end at random places beyond this point
                // depending on the server version

                if (data.length) state.raw.ranked = (data.shift() === 'true');
                if (data.length) state.raw.punkbuster = (data.shift() === 'true');
                if (data.length) state.password = (data.shift() === 'true');
                if (data.length) state.raw.uptime = parseInt(data.shift());
                if (data.length) state.raw.roundtime = parseInt(data.shift());

                const isBadCompany2 = data[0] === 'BC2';
                if (isBadCompany2) {
                    if (data.length) data.shift();
                    if (data.length) data.shift();
                }
                if (data.length) {
                    state.raw.ip = data.shift();
                    const split = state.raw.ip.split(':');
                    state.gameHost = split[0];
                    state.gamePort = split[1];
                } else {
                    // best guess if the server doesn't tell us what the server port is
                    // these are just the default game ports for different default query ports
                    if (this.options.port === 48888) state.gamePort = 7673;
                    if (this.options.port === 22000) state.gamePort = 25200;
                }
                if (data.length) state.raw.punkbusterversion = data.shift();
                if (data.length) state.raw.joinqueue = (data.shift() === 'true');
                if (data.length) state.raw.region = data.shift();
                if (data.length) state.raw.pingsite = data.shift();
                if (data.length) state.raw.country = data.shift();
                if (data.length) state.raw.quickmatch = (data.shift() === 'true');
            }

            {
                const data = await this.query(socket, ['version']);
                data.shift();
                state.raw.version = data.shift();
            }

            {
                const data = await this.query(socket, ['listPlayers', 'all']);
                const fieldCount = parseInt(data.shift());
                const fields = [];
                for (let i = 0; i < fieldCount; i++) {
                    fields.push(data.shift());
                }
                const numplayers = data.shift();
                for (let i = 0; i < numplayers; i++) {
                    const player = {};
                    for (let key of fields) {
                        let value = data.shift();

                        if (key === 'teamId') key = 'team';
                        else if (key === 'squadId') key = 'squad';

                        if (
                            key === 'kills'
                            || key === 'deaths'
                            || key === 'score'
                            || key === 'rank'
                            || key === 'team'
                            || key === 'squad'
                            || key === 'ping'
                            || key === 'type'
                        ) {
                            value = parseInt(value);
                        }

                        player[key] = value;
                    }
                    state.players.push(player);
                }
            }
        });
    }

    async query(socket, params) {
        const outPacket = this.buildPacket(params);
        return await this.tcpSend(socket, outPacket, (data) => {
            const decoded = this.decodePacket(data);
            if(decoded) {
                this.debugLog(decoded);
                if(decoded.shift() !== 'OK') throw new Error('Missing OK');
                return decoded;
            }
        });
    }

    buildPacket(params) {
        const paramBuffers = [];
        for (const param of params) {
            paramBuffers.push(Buffer.from(param,'utf8'));
        }

        let totalLength = 12;
        for (const paramBuffer of paramBuffers) {
            totalLength += paramBuffer.length+1+4;
        }

        const b = Buffer.alloc(totalLength);
        b.writeUInt32LE(0,0);
        b.writeUInt32LE(totalLength,4);
        b.writeUInt32LE(params.length,8);
        let offset = 12;
        for (const paramBuffer of paramBuffers) {
            b.writeUInt32LE(paramBuffer.length, offset); offset += 4;
            paramBuffer.copy(b, offset); offset += paramBuffer.length;
            b.writeUInt8(0, offset); offset += 1;
        }

        return b;
    }
    decodePacket(buffer) {
        if(buffer.length < 8) return false;
        const reader = this.reader(buffer);
        const header = reader.uint(4);
        const totalLength = reader.uint(4);
        if(buffer.length < totalLength) return false;
        this.debugLog("Expected " + totalLength + " bytes, have " + buffer.length);

        const paramCount = reader.uint(4);
        const params = [];
        for(let i = 0; i < paramCount; i++) {
            params.push(reader.pascalString(4));
            const strNull = reader.uint(1);
        }
        return params;
    }
}

module.exports = Battlefield;