module.exports = require('./unreal2').extend({
	init: function() {
		this._super();
		this.options.port = 7708;
	}
});
