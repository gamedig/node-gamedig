module.exports = require('./quake2').extend({
	init: function() {
		this._super();
		this.responseHeader = 'n';
		this.isQuake1 = true;
	}
});
