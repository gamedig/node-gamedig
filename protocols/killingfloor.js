module.exports = require('./unreal2').extend({
	readExtraInfo: function(reader,state) {
		state.raw.wavecurrent = reader.uint(4);
		state.raw.wavetotal = reader.uint(4);
	}
});
