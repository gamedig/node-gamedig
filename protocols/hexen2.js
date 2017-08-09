class Hexen2 extends require('./quake1') {
    constructor() {
        super();
        this.sendHeader = '\xFFstatus\x0a';
        this.responseHeader = '\xffn';
    }
}

module.exports = Hexen2;
