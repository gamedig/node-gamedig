module.exports = require('./protocols/gamespy3').extend({
	init: function() {
		this._super();
		this.noChallenge = true;
		this.pretty = 'Battlefield 2';
		this.options.port = 29900;
	}
});
