const Core = require('./core');

class Tribes1 extends Core {
    constructor() {
        super();
        this.encoding = 'latin1';
        this.requestByte = 0x62;
        this.responseByte = 0x63;
        this.challenge = 0x01;
    }

    async run(state) {
        const query = Buffer.alloc(3);
        query.writeUInt8(this.requestByte, 0);
        query.writeUInt16LE(this.challenge, 1);
        const reader = await this.udpSend(query,(buffer) => {
            const reader = this.reader(buffer);
            const responseByte = reader.uint(1);
            if (responseByte !== this.responseByte) {
                this.debugLog('Unexpected response byte');
                return;
            }
            const challenge = reader.uint(2);
            if (challenge !== this.challenge) {
                this.debugLog('Unexpected challenge');
                return;
            }
            const requestByte = reader.uint(1);
            if (requestByte !== this.requestByte) {
                this.debugLog('Unexpected request byte');
                return;
            }
            return reader;
        });

        state.raw.gametype = this.readString(reader);
        const isStarsiege2009 = state.raw.gametype === 'Starsiege';
        state.raw.version = this.readString(reader);
        state.name = this.readString(reader);

        if (isStarsiege2009) {
            state.password = !!reader.uint(1);
            state.raw.dedicated = !!reader.uint(1);
            state.raw.dropInProgress = !!reader.uint(1);
            state.raw.gameInProgress = !!reader.uint(1);
            state.raw.playerCount = reader.uint(4);
            state.maxplayers = reader.uint(4);
            state.raw.teamPlay = reader.uint(1);
            state.map = this.readString(reader);
            state.raw.cpuSpeed = reader.uint(2);
            state.raw.factoryVeh = reader.uint(1);
            state.raw.allowTecmix = reader.uint(1);
            state.raw.spawnLimit = reader.uint(4);
            state.raw.fragLimit = reader.uint(4);
            state.raw.timeLimit = reader.uint(4);
            state.raw.techLimit = reader.uint(4);
            state.raw.combatLimit = reader.uint(4);
            state.raw.massLimit = reader.uint(4);
            state.raw.playersSent = reader.uint(4);
            const teams = {1:'yellow', 2:'blue', 4:'red', 8:'purple'};
            while (!reader.done()) {
                const player = {};
                player.name = this.readString(reader);
                const teamId = reader.uint(1);
                const team = teams[teamId];
                if (team) player.team = teams[teamId];
            }
            return;
        }

        state.raw.dedicated = !!reader.uint(1);
        state.password = !!reader.uint(1);
        state.raw.playerCount = reader.uint(1);
        state.maxplayers = reader.uint(1);
        state.raw.cpuSpeed = reader.uint(2);
        state.raw.mod = this.readString(reader);
        state.raw.type = this.readString(reader);
        state.map = this.readString(reader);
        state.raw.motd = this.readString(reader);
        state.raw.teamCount = reader.uint(1);

        const teamFields = this.readFieldList(reader);
        const playerFields = this.readFieldList(reader);

        state.raw.teams = [];
        for(let i = 0; i < state.raw.teamCount; i++) {
            const teamName = this.readString(reader);
            const teamValues = this.readValues(reader);

            const teamInfo = {};
            for (let i = 0; i < teamValues.length && i < teamFields.length; i++) {
                let key = teamFields[i];
                let value = teamValues[i];
                if (key === 'ultra_base') key = 'name';
                if (value === '%t') value = teamName;
                if (['score','players'].includes(key)) value = parseInt(value);
                teamInfo[key] = value;
            }
            state.raw.teams.push(teamInfo);
        }

        for(let i = 0; i < state.raw.playerCount; i++) {
            const ping = reader.uint(1) * 4;
            const packetLoss = reader.uint(1);
            const teamNum = reader.uint(1);
            const name = this.readString(reader);
            const playerValues = this.readValues(reader);

            const playerInfo = {};
            for (let i = 0; i < playerValues.length && i < playerFields.length; i++) {
                let key = playerFields[i];
                let value = playerValues[i];
                if (value === '%p') value = ping;
                if (value === '%l') value = packetLoss;
                if (value === '%t') value = teamNum;
                if (value === '%n') value = name;
                if (['score','ping','pl','kills','lvl'].includes(key)) value = parseInt(value);
                if (key === 'team') {
                    const teamId = parseInt(value);
                    if (teamId >= 0 && teamId < state.raw.teams.length && state.raw.teams[teamId].name) {
                        value = state.raw.teams[teamId].name;
                    } else {
                        continue;
                    }
                }
                playerInfo[key] = value;
            }
            state.players.push(playerInfo);
        }
    }
    readFieldList(reader) {
        const str = this.readString(reader);
        if (!str) return [];
        return ('?'+str)
            .split('\t')
            .map((a) => a.substr(1).trim().toLowerCase())
            .map((a) => a === 'team name' ? 'name' : a)
            .map((a) => a === 'player name' ? 'name' : a);
    }
    readValues(reader) {
        const str = this.readString(reader);
        if (!str) return [];
        return str
            .split('\t')
            .map((a) => a.trim());
    }
    readString(reader) {
        return reader.pascalString(1);
    }
}

module.exports = Tribes1;
