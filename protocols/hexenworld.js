module.exports = require('./quake2').extend({
	init: function() {
		this._super();
		this.sendHeader = '\xFFstatus\x0a';
	}
});
