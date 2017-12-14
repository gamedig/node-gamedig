const async = require('async');

class Battlefield extends require('./core') {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.isBadCompany2 = false;
    }

    run(state) {
        async.series([
            (c) => {
                this.query(['serverInfo'], (data) => {
                    if(this.debug) console.log(data);
                    if(data.shift() !== 'OK') return this.fatal('Missing OK');

                    state.raw.name = data.shift();
                    state.raw.numplayers = parseInt(data.shift());
                    state.maxplayers = parseInt(data.shift());
                    state.raw.gametype = data.shift();
                    state.map = data.shift();
                    state.raw.roundsplayed = parseInt(data.shift());
                    state.raw.roundstotal = parseInt(data.shift());

                    const teamCount = data.shift();
                    state.raw.teams = [];
                    for(let i = 0; i < teamCount; i++) {
                        const tickets = parseFloat(data.shift());
                        state.raw.teams.push({
                            tickets:tickets
                        });
                    }

                    state.raw.targetscore = parseInt(data.shift());
                    data.shift();
                    state.raw.ranked = (data.shift() === 'true');
                    state.raw.punkbuster = (data.shift() === 'true');
                    state.password = (data.shift() === 'true');
                    state.raw.uptime = parseInt(data.shift());
                    state.raw.roundtime = parseInt(data.shift());
                    if(this.isBadCompany2) {
                        data.shift();
                        data.shift();
                    }
                    state.raw.ip = data.shift();
                    state.raw.punkbusterversion = data.shift();
                    state.raw.joinqueue = (data.shift() === 'true');
                    state.raw.region = data.shift();
                    if(!this.isBadCompany2) {
                        state.raw.pingsite = data.shift();
                        state.raw.country = data.shift();
                        state.raw.quickmatch = (data.shift() === 'true');
                    }

                    c();
                });
            },
            (c) => {
                this.query(['version'], (data) => {
                    if(this.debug) console.log(data);
                    if(data[0] !== 'OK') return this.fatal('Missing OK');

                    state.raw.version = data[2];

                    c();
                });
            },
            (c) => {
                this.query(['listPlayers','all'], (data) => {
                    if(this.debug) console.log(data);
                    if(data.shift() !== 'OK') return this.fatal('Missing OK');

                    const fieldCount = parseInt(data.shift());
                    const fields = [];
                    for(let i = 0; i < fieldCount; i++) {
                        fields.push(data.shift());
                    }
                    const numplayers = data.shift();
                    for(let i = 0; i < numplayers; i++) {
                        const player = {};
                        for (let key of fields) {
                            let value = data.shift();

                            if(key === 'teamId') key = 'team';
                            else if(key === 'squadId') key = 'squad';

                            if(
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

                    this.finish(state);
                });
            }
        ]);
    }
    query(params,c) {
        this.tcpSend(buildPacket(params), (data) => {
            const decoded = this.decodePacket(data);
            if(!decoded) return false;
            c(decoded);
            return true;
        });
    }
    decodePacket(buffer) {
        if(buffer.length < 8) return false;
        const reader = this.reader(buffer);
        const header = reader.uint(4);
        const totalLength = reader.uint(4);
        if(buffer.length < totalLength) return false;

        const paramCount = reader.uint(4);
        const params = [];
        for(let i = 0; i < paramCount; i++) {
            const len = reader.uint(4);
            params.push(reader.string({length:len}));
            const strNull = reader.uint(1);
        }
        return params;
    }
}

function buildPacket(params) {
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

module.exports = Battlefield;