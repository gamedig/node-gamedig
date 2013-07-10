var EventEmitter = require('events').EventEmitter,
	dns = require('dns'),
	async = require('async'),
	Class = require('../Class'),
	Reader = require('../reader');

module.exports = Class.extend(EventEmitter,{
	init: function() {
		this._super();
		this.options = {};
		this.maxAttempts = 1;
		this.attempt = 1;
		this.finished = false;
		this.encoding = 'utf8';
		this.byteorder = 'le';
		this.delimiter = '\0';

		var self = this;
		this.globalTimeoutTimer = setTimeout(function() {
			self.fatal('timeout');
		},10000);
	},

	fatal: function(err) {
		this.error(err,true);
	},
	error: function(err,fatal) {
		if(!fatal && this.attempt < this.maxAttempts) {
			this.attempt++;
			this.start();
			return;
		}

		this.done({error: err.toString()});
	},
	finish: function(result) {
		this.done(result);
	},
	done: function(result) {
		if(this.finished) return;

		clearTimeout(this.globalTimeoutTimer);

		if(this.options.notes)
			result.notes = this.options.notes;

		this.reset();
		this.finished = true;
		this.emit('finished',result);
		if(this.options.callback) this.options.callback(result);
	},

	reset: function() {
		if(this.timers) {
			this.timers.forEach(function(timer) {
				clearTimeout(timer);
			});
		}
		this.timers = [];

		this.udpTimeoutTimer = false;
		this.udpCallback = false;
	},
	start: function() {
		var self = this;
		this.reset();

		async.series([
			function(c) {
				// resolve host names
				if(!('host' in self.options)) return c();
				if(self.options.host.match(/\d+\.\d+\.\d+\.\d+/)) {
					self.options.address = self.options.host;
					c();
				} else {
					dns.lookup(self.options.host, function(err,address,family) {
						if(err) return self.error(err);
						self.options.address = address;
						c();
					});
				}
			}, function(c) {
				self.run();
			}

		]);
	},

	reader: function(buffer) {
		return new Reader(this,buffer);
	},

	setTimeout: function(c,t) {
		if(this.finished) return 0;
		var id = setTimeout(c,t);
		this.timers.push(id);
		return id;
	},

	udpSend: function(buffer,onpacket,ontimeout) {
		var self = this;
		process.nextTick(function() {
			if(self.udpCallback) return self.fatal('Attempted to send UDP packet while still waiting on a managed response');
			self._udpSendNow(buffer);
			if(!onpacket) return;

			self.udpTimeoutTimer = self.setTimeout(function() {
				self.udpCallback = false;
				var timeout = false;
				if(!ontimeout || ontimeout() !== true) timeout = true;
				if(timeout) self.error('timeout');
			},1000);
			self.udpCallback = onpacket;
		});
	},
	_udpSendNow: function(buffer) {
		if(!('port' in this.options)) return this.fatal('Attempted to send without setting a port');
		if(!('address' in this.options)) return this.fatal('Attempted to send without setting an address');

		if(typeof buffer == 'string') buffer = new Buffer(buffer,'binary');
		this.udpSocket.send(buffer,0,buffer.length,this.options.port,this.options.address);
	},
	_udpResponse: function(buffer) {
		if(this.udpCallback) {
			var result = this.udpCallback(buffer);
			if(result === true) {
				// we're done with this udp session
				clearTimeout(this.udpTimeoutTimer);
				this.udpCallback = false;
			}
		} else {
			this.udpResponse(buffer);
		}
	},
	udpResponse: function() {}
});
