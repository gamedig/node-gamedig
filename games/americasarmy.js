module.exports = require('./protocols/gamespy2').extend({
	init: function() {
		this._super();
		this.options.port = 1717;
		this.pretty = 'America\'s Army 1';
	},
	finalizeState: function(state) {
		this._super(state);
		state.name = this.stripColor(state.name);
		state.map = this.stripColor(state.map);
		for(var i in state.raw) {
			if(!(typeof state.raw[i] == 'string')) continue;
			state.raw[i] = this.stripColor(state.raw[i]);
		}
		for(var i = 0; i < state.players.length; i++) {
			var player = state.players[i];
			if(!('name' in player)) continue;
			player.name = this.stripColor(player.name);
		}
	},
	stripColor: function(str) {
		// uses unreal 2 color codes
		return str.replace(/\x1b...|[\x00-\x1a]/g,'');
	}
});
