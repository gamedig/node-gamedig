module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.options.port = 27910;
		this.encoding = 'latin1';
		this.delimiter = '\n';
		this.sendHeader = 'status';
		this.responseHeader = 'print';
	},
	run: function() {
		var self = this;

		this.udpSend('\xff\xff\xff\xff'+this.sendHeader+'\x00',function(buffer) {
			var reader = self.reader(buffer);
			var header = reader.string();
			if(header != '\xff\xff\xff\xff'+this.responseHeader) return;

			var state = {};

			var info = reader.string().split('\\');
			if(info[0] == '') info.shift();
			while(true) {
				var key = info.shift();
				var value = info.shift();
				if(typeof value == 'undefined') break;
				state[key] = value;
			}

			state.players = [];
			while(!reader.done()) {
				var player = reader.string();
				var split = player.split('"');
				var split1 = split[0].split(' ');

				var frags = parseInt(split1[0]);
				var ping = parseInt(split1[1]);
				var name = split[1] || '';
				var address = split[3] || '';
				
				state.players.push({
					frags:frags, ping:ping, name:name, address:address
				});
			}

			self.finish(state);
			return true;
		});
	}
});
