module.exports = require('./protocols/unreal2').extend({
	init: function() {
		this._super();
		this.options.port = 7778;
		this.pretty = 'Unreal Tournament 2004';
	},
	readExtraInfo: function(reader,state) {
		state.raw.ping = reader.uint(4);
		state.raw.flags = reader.uint(4);
		state.raw.skill = reader.uint(2);
	}
});
