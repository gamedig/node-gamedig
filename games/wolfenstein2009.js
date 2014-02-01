// this was assembled from old docs and not tested
// hopefully it still works

module.exports = require('./protocols/doom3').extend({
	init: function() {
		this._super();
		this.pretty = 'Wolfenstein 2009';
		this.hasSpaceBeforeClanTag = true;
		this.hasClanTag = true;
		this.hasTypeFlag = true;
	}
});
