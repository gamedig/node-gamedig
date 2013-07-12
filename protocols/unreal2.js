var async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.encoding = 'latin1';
	},
	run: function(state) {

		var self = this;

		async.series([
			function(c) {
				self.sendPacket(0,true,function(b) {
					var reader = self.reader(b);
					state.raw.serverid = reader.uint(4);
					state.raw.ip = reader.pascal();
					state.raw.port = reader.uint(4);
					state.raw.queryport = reader.uint(4);
					state.name = reader.pascal();
					state.map = reader.pascal();
					state.raw.gametype = reader.pascal();
					state.raw.numplayers = reader.uint(4);
					state.maxplayers = reader.uint(4);
					state.raw.ping = reader.uint(4);
					c();
				});
			},
			function(c) {
				self.sendPacket(1,true,function(b) {
					var reader = self.reader(b);
					state.raw.mutators = [];
					state.raw.rules = {};
					while(!reader.done()) {
						var key = reader.pascal();
						var value = reader.pascal();
						if(key == 'Mutator') state.raw.mutators.push(value);
						else state.raw.rules[key] = value;
					}

					if('GamePassword' in state.raw.rules)
						state.password = state.raw.rules.GamePassword != 'True';

					c();
				});
			},
			function(c) {
				self.sendPacket(2,false,function(b) {
					var reader = self.reader(b);
					while(!reader.done()) {
						var id = reader.uint(4);
						var name = reader.pascal();
						var ping = reader.uint(4);
						var score = reader.uint(4);
						reader.skip(4);
						(ping == 0 ? state.bots : state.players).push({
							id: id, name: name, ping: ping, score: score
						});
					}
					c();
				});
			},
			function(c) {
				self.finish(state);
			}
		]);
	},
	sendPacket: function(type,required,callback) {
		var outbuffer = new Buffer([0x79,0,0,0,type]);

		var packets = [];
		this.udpSend(outbuffer,function(buffer) {
			var iType = buffer.readUInt8(4);
			if(iType != type) return;
			packets.push(buffer.slice(5));
		},function() {
			if(!packets.length && required) return;
			callback(Buffer.concat(packets));
			return true;
		});
	}
});
