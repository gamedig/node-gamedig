module.exports = require('./gamespy3').extend({
	init: function() {
		this._super();
		this.maxAttempts = 2;
		this.options.port = 25565;
	}
});
