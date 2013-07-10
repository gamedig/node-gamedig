module.exports = require('./gamespy').extend({
	init: function() {
		this._super();
		this.options.port = 7778;
	}
});
