var dns = require('dns');

module.exports = require('./protocols/gamespy3').extend({
	init: function() {
		this._super();
		this.pretty = 'Minecraft';
		this.maxAttempts = 2;
		this.options.port = 25565;
	},
	parseDns: function(host,c) {
		var self = this;
		var _super = this._super;
		function fallback(h) { _super.call(self,h,c); }

		dns.resolve('_minecraft._tcp.'+host, 'SRV', function(err,addresses) {
			if(err) return fallback(host);
			if(addresses.length >= 1) {
				var line = addresses[0];
				self.options.port = line.port;
				var srvhost = line.name;
				
				if(srvhost.match(/\d+\.\d+\.\d+\.\d+/)) {
					self.options.address = srvhost;
					c();
				} else {
					// resolve yet again
					fallback(srvhost);
				}
				return;
			}
			return fallback(host);
		});
	}
});
