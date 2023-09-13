import Quake3 from './quake3';

export class Warsow extends Quake3 {
    async run(state) {
        await super.run(state);
        if(state.players) {
            for(const player of state.players) {
                player.team = player.address;
                delete player.address;
            }
        }
    }
}
