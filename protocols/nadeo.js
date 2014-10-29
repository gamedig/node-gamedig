var gbxremote = require('gbxremote'),
	async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.options.port = 2350;
		this.options.port_query = 5000;
		this.gbxclient = false;
	},
	reset: function() {
		this._super();
		if(this.gbxclient) {
			this.gbxclient.terminate();
			this.gbxclient = false;
		}
	},
	run: function(state) {
		var self = this;

		var cmds = [
			['Connect'],
			['Authenticate', this.options.login,this.options.password],
			['GetStatus'],
			['GetPlayerList',500,0],
			['GetServerOptions'],
			['GetCurrentChallengeInfo'],
			['GetCurrentGameInfo']
		];
		var results = [];

		async.eachSeries(cmds, function(cmdset,c) {
			var cmd = cmdset[0];
			var params = cmdset.slice(1);

			if(cmd == 'Connect') {
				var client = self.gbxclient = gbxremote.createClient(self.options.port_query,self.options.host, function(err) {
					if(err) return self.fatal('GBX error '+JSON.stringify(err));
					c();
				});
				client.on('error',function(){});
			} else {
				self.gbxclient.methodCall(cmd, params, function(err, value) {
					if(err) return self.fatal('XMLRPC error '+JSON.stringify(err));
					results.push(value);
					c();
				});
			}
		}, function() {
			var gamemode = '';
			var igm = results[5].GameMode;
			if(igm == 0) gamemode="Rounds";
			if(igm == 1) gamemode="Time Attack";
			if(igm == 2) gamemode="Team";
			if(igm == 3) gamemode="Laps";
			if(igm == 4) gamemode="Stunts";
			if(igm == 5) gamemode="Cup";

			state.name = self.stripColors(results[3].Name);
			state.password = (results[3].Password != 'No password');
			state.maxplayers = results[3].CurrentMaxPlayers;
			state.map = self.stripColors(results[4].Name);
			state.raw.gametype = gamemode;

			results[2].forEach(function(player) {
				state.players.push({name:self.stripColors(player.Name)});
			});

			self.finish(state);
		});
	},
	stripColors: function(str) {
		return str.replace(/\$([0-9a-f][^\$]?[^\$]?|[^\$]?)/g,'');
	}
});
