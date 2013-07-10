var async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.goldsrc = false;
	},
	run: function() {

		var self = this;
		var challenge;
		var state = {};

		async.series([
			function(c) {
				self.sendPacket(
					0x54,false,new Buffer('Source Engine Query'),
					self.goldsrc ? 0x6D : 0x49,
					function(b) {
						var reader = self.reader(b);
						
						if(self.goldsrc) state.address = reader.string();
						else state.protocol = reader.uint(1);

						state.name = reader.string();
						state.map = reader.string();
						state.folder = reader.string();
						state.game = reader.string();
						state.steamappid = reader.uint(2);
						state.numplayers = reader.uint(1);
						state.maxplayers = reader.uint(1);

						if(self.goldsrc) state.protocol = reader.uint(1);
						else state.numbots = reader.uint(1);

						state.listentype = String.fromCharCode(reader.uint(1));
						state.environment = String.fromCharCode(reader.uint(1));
						state.passworded = reader.uint(1);
						if(self.goldsrc) {
							state.ismod = reader.uint(1);
							if(state.ismod) {
								state.modlink = reader.string();
								state.moddownload = reader.string();
								reader.skip(1);
								state.modversion = reader.uint(4);
								state.modsize = reader.uint(4);
								state.modtype = reader.uint(1);
								state.moddll = reader.uint(1);
							}
						}
						state.secure = reader.uint(1);

						if(self.goldsrc) {
							state.numbots = reader.uint(1);
						} else {
							if(state.folder == 'ship') {
								state.shipmode = reader.uint(1);
								state.shipwitnesses = reader.uint(1);
								state.shipduration = reader.uint(1);
							}
							state.version = reader.string();
							var extraFlag = reader.uint(1);
							if(extraFlag & 0x80) state.port = reader.uint(2);
							if(extraFlag & 0x10) state.steamid = reader.uint(8);
							if(extraFlag & 0x40) {
								state.sourcetvport = reader.uint(2);
								state.sourcetvname = reader.string();
							}
							if(extraFlag & 0x20) state.tags = reader.string();
							if(extraFlag & 0x01) state.gameid = reader.uint(8);
						}

						c();
					}
				);
			},
			function(c) {
				self.sendPacket(0x55,0xffffffff,false,0x41,function(b) {
					var reader = self.reader(b);
					challenge = reader.uint(4);
					c();
				});
			},
			function(c) {
				self.sendPacket(0x55,challenge,false,0x44,function(b) {
					var reader = self.reader(b);
					var num = reader.uint(1);
					state.players = [];
					for(var i = 0; i < num; i++) {
						reader.skip(1);
						var name = reader.string();
						var score = reader.uint(4);
						var time = reader.float();
						state.players.push({
							name:name, score:score, time:time
						});
					}
					c();
				});
			},
			function(c) {
				self.sendPacket(0x56,challenge,false,0x45,function(b) {
					var reader = self.reader(b);
					var num = reader.uint(2);
					state.rules = [];
					for(var i = 0; i < num; i++) {
						var key = reader.string();
						var value = reader.string();
						state.rules[key] = value;
					}
					c();
				});
			},
			function(c) {
				self.finish(state);
			}
		]);
	},
	sendPacket: function(type,challenge,payload,expect,callback) {
		var self = this;

		var challengeLength = challenge === false ? 0 : 4;
		var payloadLength = payload ? payload.length : 0;

		var b = new Buffer(5 + challengeLength + payloadLength);
		b.writeInt32LE(-1, 0);
		b.writeUInt8(type, 4);
		if(challengeLength) b.writeUInt32LE(challenge, 5);
		if(payloadLength) payload.copy(b, 5+challengeLength);

		function received(payload) {
			var type = payload.readUInt8(0);
			if(type != expect) return;
			callback(payload.slice(1));
			return true;
		}

		var packets = [];
		this.udpSend(b,function(buffer) {
			var header = buffer.readInt32LE(0);
			if(header == -1) return received(buffer.slice(4));

			// partial pack
			console.log(buffer);
		});
	}
});
