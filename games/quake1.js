module.exports = require('./protocols/quake2').extend({
	init: function() {
		this._super();
		this.pretty = 'Quake 1';
		this.options.port = 27500;
		this.responseHeader = 'n';
		this.isQuake1 = true;
	}
});
