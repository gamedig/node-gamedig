class Warsow extends require('./quake3') {
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
