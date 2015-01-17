var async = require('async');

module.exports = require('./core').extend({
	run: function(state) {
		var self = this;

		async.series([
			function(c) {
				self.sendCommand('use port='+self.options.port, function(data) {
					var split = data.split('\n\r');
					if(split[0] != 'TS3') self.fatal('Invalid header');
					c();
				}, true);
			},
			function(c) {
				self.sendCommand('serverinfo', function(data) {
					state.raw = data[0];
					if('virtualserver_name' in state.raw) state.name = state.raw.virtualserver_name;
                    if('virtualserver_maxclients' in state.raw) state.maxplayers = state.raw.virtualserver_maxclients;
					c();
				});
			},
			function(c) {
				self.sendCommand('clientlist', function(data) {
					for(var i = 0; i < data.length; i++) {
						data[i].name = data[i].client_nickname;
						delete data[i].client_nickname;
						state.players.push(data[i]);
					}
					c();
				});
			},
			function(c) {
				self.sendCommand('channellist -topic', function(data) {
					state.raw.channels = data;
					c();
				});
			},
			function(c) {
				self.finish(state);
			}
		]);
	},
	sendCommand: function(cmd,c,raw) {
		this.tcpSend(cmd+'\x0A', function(buffer) {
			if(buffer.length < 21) return;
			if(buffer.slice(-21).toString() != '\n\rerror id=0 msg=ok\n\r') return;
			var body = buffer.slice(0,-21).toString();

			var out;

			if(raw) {
				out = body;
			} else {
				var segments = body.split('|');
				out = [];
				segments.forEach(function(line) {
					var split = line.split(' ');
					var unit = {};
					split.forEach(function(field) {
						var equals = field.indexOf('=');
						var key = equals == -1 ? field : field.substr(0,equals);
						var value = equals == -1 ? '' : field.substr(equals+1)
							.replace(/\\s/g,' ').replace(/\\\//g,'/');
						unit[key] = value;
					});
					out.push(unit);
				});
			}

			c(out);

			return true;
		});
	}
});
