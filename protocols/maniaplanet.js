var gbxremote = require('gbxremote'),
	async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.options.port = 5000;
		this.gbxclient = false;
	},
	reset: function() {
		this._super();
		console.log("~~TERM");
		if(this.gbxclient) this.gbxclient.terminate();
	},
	run: function() {
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
				var client = self.gbxclient = gbxremote.createClient(self.options.port,self.options.host, function(err) {
					if(err) return self.error('GBX error '+JSON.stringify(err));
					c();
				});
				client.on('error',function(){});
			} else {
				self.gbxclient.methodCall(cmd, params, function(err, value) {
					if(err) return self.error('XMLRPC error '+JSON.stringify(err));
					results.push(value);
					c();
				});
			}
		}, function() {
			var state = {};
			for(var i in results[1]) state[i] = results[1][i];
			for(var i in results[3]) state[i] = results[3][i];
			for(var i in results[4]) state[i] = results[4][i];

			var gamemode = '';
			var igm = results[5].GameMode;
			if(igm == 0) gamemode="Rounds";
			if(igm == 1) gamemode="Time Attack";
			if(igm == 2) gamemode="Team";
			if(igm == 3) gamemode="Laps";
			if(igm == 4) gamemode="Stunts";
			if(igm == 5) gamemode="Cup";
			state.gamemode = gamemode;

			console.log(state);
			// strip colors from Name, Player.NickName
		});
	}
/*
	function stripColors($str) {
		$str2 = str_replace("$", "\001", preg_replace("`[\001\002]`","","a".$str) );
		$str2 = str_replace("\001\001","$", $str2);
		$str2 = preg_replace("`\001[hlHL]`","\002",$str2);
		$str2 = preg_replace("`\002\[([^\]]*)\]([^\002]*)\002`","$2",$str2);
		$str2 = preg_replace("`\002\[([^\]]*)\]`","",$str2);
		$str2 = str_replace("\002","", $str2);
		$str2 = preg_replace("`\001([0-9a-fA-F][0-9a-zA-Z][0-9a-zA-Z]|[^\001])`","",$str2);
		$str2 = str_replace("\001","$$", substr($str2,1) );
		return $str2;
	}
*/
});
