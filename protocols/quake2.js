module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.encoding = 'latin1';
		this.delimiter = '\n';
		this.sendHeader = 'status';
		this.responseHeader = 'print';
		this.isQuake1 = false;
	},
	run: function(state) {
		var self = this;

		this.udpSend('\xff\xff\xff\xff'+this.sendHeader+'\x00',function(buffer) {
			var reader = self.reader(buffer);
			
			var header = reader.string({length:4});
			if(header != '\xff\xff\xff\xff') return;

			var response;
			if(this.isQuake1) {
				response = reader.string({length:1});
			} else {
				response = reader.string();
			}
			if(response != this.responseHeader) return;

			var info = reader.string().split('\\');
			if(info[0] == '') info.shift();

			while(true) {
				var key = info.shift();
				var value = info.shift();
				if(typeof value == 'undefined') break;
				state.raw[key] = value;
			}

			while(!reader.done()) {
				var line = reader.string();
				if(!line || line.charAt(0) == '\0') break;

				var args = [];
				var split = line.split('"');
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

				var player = {};
				if(self.isQuake1) {
					player.id = parseInt(args.shift());
					player.score = parseInt(args.shift());
					player.time = parseInt(args.shift());
					player.ping = parseInt(args.shift());
					player.name = args.shift();
					player.skin = args.shift();
					player.color1 = parseInt(args.shift());
					player.color2 = parseInt(args.shift());
				} else {
					player.frags = parseInt(args.shift());
					player.ping = parseInt(args.shift());
					player.name = args.shift() || '';
					player.address = args.shift() || '';
				}

				(player.ping ? state.players : state.bots).push(player);
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
