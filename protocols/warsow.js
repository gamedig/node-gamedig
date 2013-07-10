module.exports = require('./quake3').extend({
	init: function() {
		this._super();
		this.options.port = 44400;
	},
	prepState: function(state) {
		this._super(state);
		if(state.players) {
			for(var i = 0; i < state.players.length; i++) {
				var player = state.players[i];
				player.team = player.address;
				delete player.address;
			}
		}
	}
});
