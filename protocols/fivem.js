class FiveM extends require('./quake2') {
    constructor() {
        super();
        this.sendHeader = 'getinfo xxx';
        this.responseHeader = 'infoResponse';
    }
}

module.exports = FiveM;
