const Valve = require('./valve');

class GoldSrc extends Valve {
    constructor() {
        super();
        this.goldsrcInfo = true;
    }
}

module.exports = GoldSrc;
