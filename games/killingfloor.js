module.exports = require('./protocols/unreal2').extend({
	init: function() {
		this._super();
		this.options.port = 7708;
		this.pretty = 'Killing Floor';
	},
	readExtraInfo: function(reader,state) {
		state.raw.wavecurrent = reader.uint(4);
		state.raw.wavetotal = reader.uint(4);
	}
});
