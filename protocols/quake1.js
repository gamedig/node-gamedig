class Quake1 extends require('./quake2') {
    constructor() {
        super();
        this.responseHeader = 'n';
        this.isQuake1 = true;
    }
}

module.exports = Quake1;
