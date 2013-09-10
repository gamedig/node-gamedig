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
	initState: function() {
		return {
			name: '',
			map: '',
			password: false,
			
			raw: {},

			maxplayers: 0,
			players: [],
			bots: []
		};
	},
	finalizeState: function(state) {},

	finish: function(state) {
		this.finalizeState(state);
		this.done(state);
	},

	done: function(state) {
		if(this.finished) return;
		clearTimeout(this.globalTimeoutTimer);

		if(this.options.notes)
			state.notes = this.options.notes;

		state.query = {};
		if('host' in this.options) state.query.host = this.options.host;
		if('address' in this.options) state.query.address = this.options.address;
		if('port' in this.options) state.query.port = this.options.port;
		state.query.type = this.type;
		if('pretty' in this) state.query.pretty = this.pretty;

		this.reset();
		this.finished = true;
		this.emit('finished',state);
		if(this.options.callback) this.options.callback(state);
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
					self.parseDns(self.options.host,c);
				}
			}, function(c) {
				self.run(self.initState());
			}

		]);
	},
	parseDns: function(host,c) {
		var self = this;
		dns.lookup(host, function(err,address,family) {
			if(err) return self.error(err);
			self.options.address = address;
			c();
		});
	},

	// utils
	reader: function(buffer) {
		return new Reader(this,buffer);
	},
	translate: function(obj,trans) {
		for(var from in trans) {
			var to = trans[from];
			if(from in obj) {
				if(to) obj[to] = obj[from];
				delete obj[from];
			}
		}
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
