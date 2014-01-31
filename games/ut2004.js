module.exports = require('./protocols/unreal2').extend({
	init: function() {
		this._super();
		this.options.port = 7778;
		this.pretty = 'Unreal Tournament 2004';
	},
	readExtraInfo: function(reader,state) {
		reader.skip(18);
		state.raw.numplayers = reader.uint(4);
		state.maxplayers = reader.uint(4);
	}
});
