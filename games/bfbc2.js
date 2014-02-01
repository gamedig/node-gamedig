module.exports = require('./protocols/battlefield').extend({
	init: function() {
		this._super();
		this.pretty = 'Battlefield: Bad Company 2';
		this.options.port = 48888;
		this.isBadCompany2 = true;
	}
});
