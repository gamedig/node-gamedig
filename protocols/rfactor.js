const Core = require('./core');

class Rfactor extends Core {
    constructor() {
        super();
        //this.byteorder = 'be';
    }

    async run(state) {
        const buffer = await this.udpSend('rF_S',b => b);
        const reader = this.reader(buffer);

        state.raw.gamename = this.readString(reader, 8);
        state.raw.fullUpdate = reader.uint(1);
        state.raw.region = reader.uint(2);
        state.raw.ip = reader.part(4);
        state.raw.size = reader.uint(2);
        state.raw.version = reader.uint(2);
        state.raw.versionRaceCast = reader.uint(2);
        state.gamePort = reader.uint(2);
        state.raw.queryPort = reader.uint(2);
        state.raw.game = this.readString(reader, 20);
        state.name = this.readString(reader, 28);
        state.map = this.readString(reader, 32);
        state.raw.motd = this.readString(reader, 96);
        state.raw.packedAids = reader.uint(2);
        state.raw.ping = reader.uint(2);
        state.raw.packedFlags = reader.uint(1);
        state.raw.rate = reader.uint(1);
        state.players.setNum(reader.uint(1));
        state.maxplayers = reader.uint(1);
        state.raw.bots = reader.uint(1);
        state.raw.packedSpecial = reader.uint(1);
        state.raw.damage = reader.uint(1);
        state.raw.packedRules = reader.uint(2);
        state.raw.credits1 = reader.uint(1);
        state.raw.credits2 = reader.uint(2);
        this.logger.debug(reader.offset());
        state.raw.time = reader.uint(2);
        state.raw.laps = reader.uint(2) / 16;
        reader.skip(3);
        state.raw.vehicles = reader.string();

        state.password = !!(state.raw.packedSpecial & 2);
        state.raw.raceCast = !!(state.raw.packedSpecial & 4);
        state.raw.fixedSetups = !!(state.raw.packedSpecial & 16);

        const aids = [
            'TractionControl',
            'AntiLockBraking',
            'StabilityControl',
            'AutoShifting',
            'AutoClutch',
            'Invulnerability',
            'OppositeLock',
            'SteeringHelp',
            'BrakingHelp',
            'SpinRecovery',
            'AutoPitstop'
        ];
        state.raw.aids = [];
        for (let offset = 0; offset < aids.length; offset++) {
            if (state.packedAids && (1 << offset)) {
                state.raw.aids.push(aids[offset]);
            }
        }
    }

    // Consumes bytesToConsume, but only returns string up to the first null
    readString(reader, bytesToConsume) {
        const consumed = reader.part(bytesToConsume);
        return this.reader(consumed).string();
    }
}

module.exports = Rfactor;
