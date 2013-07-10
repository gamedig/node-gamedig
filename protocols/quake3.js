module.exports = require('./quake2').extend({
	init: function() {
		this._super();
		this.options.port = 27960;
		this.sendHeader = 'getstatus';
		this.responseHeader = 'statusResponse';
	}
});
