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

				var args = [];
				var split = player.split('"');
				var inQuote = false;
				for(var i = 0; i < split; i++) {
					var part = split[i];
					var inQuote = (i%2 == 1);
					if(inQuote) args.push(part);
					else args = args.concat(part.split(' '));
				}

				var frags = parseInt(args[0]);
				var ping = parseInt(args[1]);
				var name = args[2] || '';
				var address = args[3] || '';

				state.players.push({
					frags:frags, ping:ping, name:name, address:address
				});
			}

			self.finish(state);
			return true;
		});
	}
});
