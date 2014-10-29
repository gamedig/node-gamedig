module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.encoding = 'latin1';
	},
	run: function(state) {
		var self = this;

		this.udpSend('M2MP',function(buffer) {
			var reader = self.reader(buffer);
			
			var header = reader.string({length:4});
			if(header != 'M2MP') return;
			
			state.name = self.readString(reader);
			state.raw.numplayers = self.readString(reader);
			state.maxplayers = self.readString(reader);
			state.raw.gamemode = self.readString(reader);
			state.password = !!reader.uint(1);
			
			while(!reader.done()) {
				var name = self.readString(reader);
				if(!name) break;
				state.players.push({
					name:name
				});
			}
			
			self.finish(state);
			return true;
		});
	},
	readString: function(reader) {
		var length = reader.uint(1);
		return reader.string({length:length-1});
	},
});
