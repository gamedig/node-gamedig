const Mafia2Multiplayer = require('./mafia2mp');

class Mafia2Online extends Mafia2Multiplayer {
    constructor() {
        super();
        this.header = 'M2Online';
        this.isMafia2Online = true;
    }
}

module.exports = Mafia2Online;
