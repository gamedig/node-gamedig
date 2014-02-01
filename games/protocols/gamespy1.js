var async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.sessionId = 1;
		this.encoding = 'latin1';
		this.byteorder = 'be';
	},
	run: function(state) {
		var self = this;

		async.series([
			function(c) {
				self.sendPacket('info', function(data) {
					state.raw = data;
					if('hostname' in state.raw) state.name = state.raw.hostname;
					if('mapname' in state.raw) state.map = state.raw.mapname;
					if(state.raw.password == '1') state.password = true;
					if('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);
					c();
				});
			},
			function(c) {
				self.sendPacket('rules', function(data) {
					state.raw.rules = data;
					c();
				});
			},
			function(c) {
				self.sendPacket('players', function(data) {
					var players = {};
					var teams = {};
					for(var ident in data) {
						var split = ident.split('_');
						var key = split[0];
						var id = split[1];
						var value = data[ident];

						if(key == 'teamname') {
							teams[id] = value;
						} else {
							if(!(id in players)) players[id] = {};
							if(key == 'playername') key = 'name';
							else if(key == 'team') value = parseInt(value)-1;
							else if(key == 'score' || key == 'ping' || key == 'deaths') value = parseInt(value);
							players[id][key] = value;
						}
					}
					
					state.raw.teams = teams;
					for(var i in players) state.players.push(players[i]);
					self.finish(state);
				});
			}
		]);

	},
	sendPacket: function(type,callback) {
		var self = this;
		var queryId = '';
		var output = {};
		this.udpSend('\\'+type+'\\',function(buffer) {
			var reader = self.reader(buffer);
			var str = reader.string({length:buffer.length});
			var split = str.split('\\');
			split.shift();
			var data = {};
			while(split.length) {
				var key = split.shift();
				var value = split.shift() || '';
				data[key] = value;
			}
			if(!('queryid' in data)) return;
			if(queryId && data.queryid != queryId) return;
			for(var i in data) output[i] = data[i];
			if('final' in output) {
				delete output.final;
				delete output.queryid;
				callback(output);
				return true;
			}
		});
	}
});
