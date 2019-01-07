const Quake3 = require('./quake3');

class Warsow extends Quake3 {
    finalizeState(state) {
        super.finalizeState(state);
        if(state.players) {
            for(const player of state.players) {
                player.team = player.address;
                delete player.address;
            }
        }
    }
}

module.exports = Warsow;
