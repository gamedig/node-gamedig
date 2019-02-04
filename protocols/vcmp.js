const Samp = require('./samp');

class Vcmp extends Samp {
    constructor() {
        super();
        this.magicHeader = 'VCMP';
        this.responseMagicHeader = 'MP04';
        this.isVcmp = true;
    }
}

module.exports = Vcmp;
