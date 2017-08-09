class HexenWorld extends require('./quake1') {
	constructor() {
		super();
		this.sendHeader = '\xFFstatus\x0a';
        this.responseHeader = '\xffn';
	}
}

module.exports = HexenWorld;
