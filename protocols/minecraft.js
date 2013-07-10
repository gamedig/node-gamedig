module.exports = require('./gamespy3').extend({
	init: function() {
		this._super();
		this.maxAttempts = 2;
		this.port = 25565;
	}
});
