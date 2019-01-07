const Quake1 = require('./quake1');

class Hexen2 extends Quake1 {
    constructor() {
        super();
        this.sendHeader = '\xFFstatus\x0a';
        this.responseHeader = '\xffn';
    }
}

module.exports = Hexen2;
