/*
module.exports = require('./valve').extend({
	init: function() {
		this._super();
	}
});
*/

// supposedly, gamespy3 is the "official" query protocol for jcmp,
// but it's broken (requires useOnlySingleSplit), and doesn't include player names
module.exports = require('./gamespy3').extend({
	init: function() {
		this._super();
		this.useOnlySingleSplit = true;
	},
	finalizeState: function(state) {
		this._super(state);
		if(!state.players.length && parseInt(state.raw.numplayers)) {
			for(var i = 0; i < parseInt(state.raw.numplayers); i++) {
				state.players.push({});
			}
		}
	}
});
