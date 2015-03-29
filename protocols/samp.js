var async = require('async');

module.exports = require('./core').extend({
	run: function(state) {

		var self = this;
		var len;

		async.series([
			function(c) {
				self.sendPacket('i',function(reader) {
					state.password = !!reader.uint(1);
					state.raw.numplayers = reader.uint(2);
					state.maxplayers = reader.uint(2);
					state.name = self.readString(reader,4);
					state.raw.gamemode = self.readString(reader,4);
					self.map = self.readString(reader,4);
					c();
				});
			},
			function(c) {
				self.sendPacket('r',function(reader) {
					var ruleCount = reader.uint(2);
					state.raw.rules = {};
					for(var i = 0; i < ruleCount; i++) {
						var key = self.readString(reader,1);
						var value = self.readString(reader,1);
						state.raw.rules[key] = value;
					}
					if('mapname' in state.raw.rules)
						state.map = state.raw.rules.mapname;
					c();
				});
			},
			function(c) {
				self.sendPacket('d',function(reader) {
					var playerCount = reader.uint(2);
					for(var i = 0; i < playerCount; i++) {
						var player = {};
						player.id = reader.uint(1);
						player.name = self.readString(reader,1);
						player.score = reader.int(4);
						player.ping = reader.uint(4);
						state.players.push(player);
					}
					c();
				},function() {
					for(var i = 0; i < state.raw.numplayers; i++) {
						state.players.push({});
					}
					c();
				});
			},
			function(c) {
				self.finish(state);
			}
		]);
	},
	readString: function(reader,lenBytes) {
		var length = reader.uint(lenBytes);
		if(!length) return '';
		var string = reader.string({length:length});
		return string;
	},
	sendPacket: function(type,onresponse,ontimeout) {
		var self = this;
		var outbuffer = new Buffer(11);
		outbuffer.writeUInt32BE(0x53414D50,0);
		var ipSplit = self.options.address.split('.');
		outbuffer.writeUInt8(parseInt(ipSplit[0]),4);
		outbuffer.writeUInt8(parseInt(ipSplit[1]),5);
		outbuffer.writeUInt8(parseInt(ipSplit[2]),6);
		outbuffer.writeUInt8(parseInt(ipSplit[3]),7);
		outbuffer.writeUInt16LE(self.options.port,8);
		outbuffer.writeUInt8(type.charCodeAt(0),10);

		this.udpSend(outbuffer,function(buffer) {
			var reader = self.reader(buffer);
			for(var i = 0; i < outbuffer.length; i++) {
				if(outbuffer.readUInt8(i) !== reader.uint(1)) return;
			}
			onresponse(reader);
			return true;
		},function() {
			if(ontimeout) {
				ontimeout();
				return true;
			}
		});
	}
});
