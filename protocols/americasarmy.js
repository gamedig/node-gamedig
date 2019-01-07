const Gamespy2 = require('./gamespy2');

class AmericasArmy extends Gamespy2 {
    async run(state) {
        await super.run(state);
        state.name = this.stripColor(state.name);
        state.map = this.stripColor(state.map);
        for(const key of Object.keys(state.raw)) {
            if(typeof state.raw[key] === 'string') {
                state.raw[key] = this.stripColor(state.raw[key]);
            }
        }
        for(const player of state.players) {
            if(!('name' in player)) continue;
            player.name = this.stripColor(player.name);
        }
    }

    stripColor(str) {
        // uses unreal 2 color codes
        return str.replace(/\x1b...|[\x00-\x1a]/g,'');
    }
}

module.exports = AmericasArmy;
