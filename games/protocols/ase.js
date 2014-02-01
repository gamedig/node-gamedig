module.exports = require('./core').extend({
	init: function() {
		this._super();
	},
	run: function(state) {
		var self = this;
		self.udpSend('s',function(buffer) {
			var reader = self.reader(buffer);

			var header = reader.string({length:4});
			if(header != 'EYE1') return;

			state.raw.gamename = self.readString(reader);
			state.raw.port = parseInt(self.readString(reader));
			state.name = self.readString(reader);
			state.raw.gametype = self.readString(reader);
			state.map = self.readString(reader);
			state.raw.version = self.readString(reader);
			state.password = self.readString(reader) == '1';
			state.raw.numplayers = parseInt(self.readString(reader));
			state.maxplayers = parseInt(self.readString(reader));

			while(!reader.done()) {
				var key = self.readString(reader);
				if(!key) break;
				var value = self.readString(reader);
				state.raw[key] = value;
			}
			
			console.log(reader.rest());
			while(!reader.done()) {
				var flags = reader.uint(1);
				var player = {};
				if(flags & 1) player.name = self.readString(reader);
				if(flags & 2) player.team = self.readString(reader);
				if(flags & 4) player.skin = self.readString(reader);
				if(flags & 8) player.score = parseInt(self.readString(reader));
				if(flags & 16) player.ping = parseInt(self.readString(reader));
				if(flags & 32) player.time = parseInt(self.readString(reader));
				state.players.push(player);
			}
			
			self.finish(state);
		});
	},
	readString: function(reader) {
		var len = reader.uint(1);
		return reader.string({length:len-1});
	}
});
