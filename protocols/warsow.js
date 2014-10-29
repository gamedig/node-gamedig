module.exports = require('./quake3').extend({
	finalizeState: function(state) {
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
