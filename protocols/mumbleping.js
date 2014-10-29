var async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.byteorder = 'be';
	},
	run: function(state) {
		var self = this;
		
		this.udpSend('\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08', function(buffer) {
			if(buffer.length < 24) return;
			var reader = self.reader(buffer);
			reader.skip(1);
			state.raw.versionMajor = reader.uint(1);
			state.raw.versionMinor = reader.uint(1);
			state.raw.versionPatch = reader.uint(1);
			reader.skip(8);
			state.raw.numplayers = reader.uint(4);
			state.maxplayers = reader.uint(4);
			state.raw.allowedbandwidth = reader.uint(4);
			for(var i = 0; i < state.raw.numplayers; i++) {
				state.players.push({});
			}
			self.finish(state);
			return true;
		});
	}
});
