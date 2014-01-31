module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.pretty = 'Quake 2';
		this.options.port = 27910;
		this.encoding = 'latin1';
		this.delimiter = '\n';
		this.sendHeader = 'status';
		this.responseHeader = 'print';
	},
	run: function(state) {
		var self = this;

		this.udpSend('\xff\xff\xff\xff'+this.sendHeader+'\x00',function(buffer) {
			var reader = self.reader(buffer);
			var header = reader.string();
			if(header != '\xff\xff\xff\xff'+this.responseHeader) return;

			var info = reader.string().split('\\');
			if(info[0] == '') info.shift();
			while(true) {
				var key = info.shift();
				var value = info.shift();
				if(typeof value == 'undefined') break;
				state.raw[key] = value;
			}

			while(!reader.done()) {
				var player = reader.string();

				var args = [];
				var split = player.split('"');
				var inQuote = false;
				split.forEach(function(part,i) {
					var inQuote = (i%2 == 1);
					if(inQuote) {
						args.push(part);
					} else {
						var splitSpace = part.split(' ');
						splitSpace.forEach(function(subpart) {
							if(subpart) args.push(subpart);
						});
					}
				});

				var frags = parseInt(args[0]);
				var ping = parseInt(args[1]);
				var name = args[2] || '';
				var address = args[3] || '';

				(ping == 0 ? state.bots : state.players).push({
					frags:frags, ping:ping, name:name, address:address
				});
			}

			if('g_needpass' in state.raw) state.password = state.raw.g_needpass;
			if('mapname' in state.raw) state.map = state.raw.mapname;
			if('sv_maxclients' in state.raw) state.maxplayers = state.raw.sv_maxclients;
			if('sv_hostname' in state.raw) state.name = state.raw.sv_hostname;

			self.finish(state);
			return true;
		});
	}
});
