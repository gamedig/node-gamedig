class FiveM extends require('./quake2') {
    constructor( timeout ) {
        super();
        this.sendHeader = 'getinfo xxx';
        this.responseHeader = 'infoResponse';
    }
}

module.exports = FiveM;
