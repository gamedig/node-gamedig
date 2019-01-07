const Quake2 = require('./quake2');

class Quake1 extends Quake2 {
    constructor() {
        super();
        this.responseHeader = 'n';
        this.isQuake1 = true;
    }
}

module.exports = Quake1;
