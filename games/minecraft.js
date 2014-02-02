module.exports = require('./protocols/gamespy3').extend({
	init: function() {
		this._super();
		this.pretty = 'Minecraft';
		this.maxAttempts = 2;
		this.options.port = 25565;
		this.srvRecord = '_minecraft._tcp';
	}
});
