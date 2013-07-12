module.exports = require('./unreal2').extend({
	init: function() {
		this._super();
		this.pretty = 'Unreal Tournament 2004';
		this.options.port = 7778;
	}
});
