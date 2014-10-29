module.exports = require('./unreal2').extend({
	readExtraInfo: function(reader,state) {
		state.raw.ping = reader.uint(4);
		state.raw.flags = reader.uint(4);
		state.raw.skill = reader.uint(2);
	}
});
