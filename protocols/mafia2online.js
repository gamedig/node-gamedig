import Mafia2Multiplayer from './mafia2mp';

export class Mafia2Online extends Mafia2Multiplayer {
    constructor() {
        super();
        this.header = 'M2Online';
        this.isMafia2Online = true;
    }
}
