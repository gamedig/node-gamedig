var request = require('request');

module.exports = require('./protocols/core').extend({
	init: function() {
		this._super();
		this.pretty = 'Build and Shoot';
		this.options.port = 32886;
	},
	run: function(state) {
		var self = this;
		request({
			uri: 'http://'+this.options.address+':'+this.options.port+'/',
			timeout: 3000,
		}, function(e,r,body) {
			if(e) return self.fatal('HTTP error');

			var m = body.match(/status server for (.*?)\r|\n/);
			if(m) state.name = m[1];

			var m = body.match(/Current uptime: (\d+)/);
			if(m) state.raw.uptime = m[1];
			
			var m = body.match(/currently running (.*?) by /);
			if(m) state.map = m[1];
			
			var m = body.match(/Current players: (\d+)\/(\d+)/);
			if(m) {
				state.raw.numplayers = m[1];
				state.maxplayers = m[2];
			}

			var m = body.match(/class="playerlist"([^]+?)\/table/);
			if(m) {
				var table = m[1];
				var pre = /<tr>[^]*<td>([^]*)<\/td>[^]*<td>([^]*)<\/td>[^]*<td>([^]*)<\/td>[^]*<td>([^]*)<\/td>/g;
				while(pm = pre.exec(table)) {
					if(pm[2] == 'Ping') continue;
					state.players.push({
						name: pm[1],
						ping: pm[2],
						team: pm[3],
						score: pm[4]
					});
				}
			}
			/*
			var m = this.options.address.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
			if(m) {
				var o1 = parseInt(m[1]);
				var o2 = parseInt(m[2]);
				var o3 = parseInt(m[3]);
				var o4 = parseInt(m[4]);
				var addr = o1+(o2<<8)+(o3<<16)+(o4<<24);
				state.raw.url = 'aos://'+addr;
			}
			*/
			self.finish(state);
		});
	}
});
