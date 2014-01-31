var request = require('request');

module.exports = require('./protocols/core').extend({
	init: function() {
		this._super();
		this.pretty = 'Terraria';
		this.options.port = 7878;
	},
	run: function(state) {
		var self = this;
		request({
			uri: 'http://'+this.options.address+':'+this.options.port+'/v2/server/status',
			timeout: 3000,
			qs: {
				players: 'true',
				token: this.options.token
			}
		}, function(e,r,body) {
			if(e) return self.error('HTTP error');
			var json;
			try {
				json = JSON.parse(body);
			} catch(e) {
				return self.error('Invalid JSON');
			}
			
			if(json.status != 200) return self.error('Invalid status');

			json.players.forEach(function(one) {
				state.players.push({name:one.nickname,team:one.team});
			});
			
			state.name = json.name;
			state.raw.port = json.port;
			state.raw.numplayers = json.playercount;

			self.finish(state);
		});
	}
});
