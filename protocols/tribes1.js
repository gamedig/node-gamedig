class Unreal2 extends require('./core') {
    constructor() {
        super();
        this.encoding = 'latin1';
    }
    run(state) {
        const queryBuffer = Buffer.from('b++');
        this.udpSend(queryBuffer,(buffer) => {
            const reader = this.reader(buffer);
            const header = reader.string({length:4});
            if (header !== 'c++b') {
                this.fatal('Header response does not match: ' + header);
                return true;
            }
            state.raw.gametype = this.readString(reader);
            state.raw.version = this.readString(reader);
            state.name = this.readString(reader);
            state.raw.dedicated = !!reader.uint(1);
            state.password = !!reader.uint(1);
            state.raw.playerCount = reader.uint(1);
            state.maxplayers = reader.uint(1);
            state.raw.cpu = reader.uint(2);
            state.raw.mod = this.readString(reader);
            state.raw.type = this.readString(reader);
            state.map = this.readString(reader);
            state.raw.motd = this.readString(reader);
            state.raw.teamCount = reader.uint(1);

            const teamFields = this.readFieldList(reader);
            const playerFields = this.readFieldList(reader);
            console.log(teamFields);
            console.log(playerFields);

            state.raw.teams = [];
            for(let i = 0; i < state.raw.teamCount; i++) {
                const teamName = this.readString(reader);
                const teamValues = this.readString(reader)
                    .replace(/%t/g, teamName)
                    .split('\t')
                    .map((a) => a.trim());

                const teamInfo = {};
                for (let i = 0; i < teamValues.length && i < teamFields.length; i++) {
                    const key = teamFields[i];
                    let value = teamValues[i];
                    if (key === 'score' || key === 'players') value = parseInt(value);
                    teamInfo[key] = value;
                }
                state.raw.teams.push(teamInfo);
            }

            for(let i = 0; i < state.raw.playerCount; i++) {
                const ping = reader.uint(1) * 4;
                const packetLoss = reader.uint(1);
                const teamNum = reader.uint(1);
                const name = this.readString(reader);
                const valuesStr = this.readString(reader);
                if (!valuesStr) continue;
                const playerValues = valuesStr
                    .replace(/%p/g, ping)
                    .replace(/%l/g, packetLoss)
                    .replace(/%t/g, teamNum)
                    .replace(/%n/g, name)
                    .split('\t')
                    .map((a) => a.trim());

                const playerInfo = {};
                for (let i = 0; i < playerValues.length && i < playerFields.length; i++) {
                    const key = playerFields[i];
                    let value = playerValues[i];
                    if (key === 'score' || key === 'ping' || key === 'pl') value = parseInt(value);
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

            this.finish(state);
            return true;
        });
    }
    readFieldList(reader) {
        return ('?'+this.readString(reader))
            .split('\t')
            .map((a) => a.substr(1).toLowerCase())
            .map((a) => a === 'team name' ? 'name' : a)
            .map((a) => a === 'player name' ? 'name' : a);
    }
    readString(reader) {
        const length = reader.uint(1);
        if(!length) return '';
        return reader.string({length:length});
    }
}

module.exports = Unreal2;
