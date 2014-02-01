module.exports = require('./protocols/doom3').extend({
	init: function() {
		this._super();
		this.pretty = 'Enemy Territory Quake Wars';
		this.options.port = 27733;
		this.isEtqw = true;
		this.hasSpaceBeforeClanTag = true;
		this.hasClanTag = true;
		this.hasTypeFlag = true;
	}
});
