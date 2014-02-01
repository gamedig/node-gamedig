module.exports = require('./protocols/doom3').extend({
	init: function() {
		this._super();
		this.pretty = 'Quake 4';
		this.hasClanTag = true;
		this.options.port = 28004;
	}
});
