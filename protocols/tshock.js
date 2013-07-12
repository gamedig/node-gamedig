var request = require('request');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.pretty = 'Terraria';
		this.options.port = 7878;
	},
	run: function(state) {
		var self = this;
		request({
			uri: 'http://'+this.options.address+':'+this.options.port+'/status',
			timeout: 3000,
		}, function(e,r,body) {
			if(e) return self.error('HTTP error');
			var json;
			try {
				json = JSON.parse(body);
			} catch(e) {
				return self.error('Invalid JSON');
			}
			
			if(json.status != 200) return self.error('Invalid status');

			var split = json.players.split(',');
			split.forEach(function(one) {
				state.players.push({name:one});
			});
			
			state.name = json.name;
			state.raw.port = json.port;
			state.raw.numplayers = json.playercount;

			self.finish(state);
		});
	}
});
