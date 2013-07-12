module.exports = require('./unreal2').extend({
	init: function() {
		this._super();
		this.pretty = 'Killing Floor';
		this.options.port = 7708;
	}
});
