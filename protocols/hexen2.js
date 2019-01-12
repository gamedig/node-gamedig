const Quake1 = require('./quake1');

class Hexen2 extends Quake1 {
    constructor() {
        super();
        this.sendHeader = '\xFFstatus\x0a';
        this.responseHeader = '\xffn';
    }
    async run(state) {
        await super.run(state);
        state.gamePort = this.options.port - 50;
    }
}

module.exports = Hexen2;
