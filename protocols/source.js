var async = require('async'),
	Bzip2 = require('compressjs').Bzip2;

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.goldsrc = false;
		this.options.port = 27015;
	},
	run: function(state) {

		var self = this;
		var challenge;

		async.series([
			function(c) {
				self.sendPacket(
					0x54,false,new Buffer('Source Engine Query\0'),
					self.goldsrc ? 0x6D : 0x49,
					function(b) {
						var reader = self.reader(b);
						
						if(self.goldsrc) state.raw.address = reader.string();
						else state.raw.protocol = reader.uint(1);

						state.name = reader.string();
						state.map = reader.string();
						state.raw.folder = reader.string();
						state.raw.game = reader.string();
						state.raw.steamappid = reader.uint(2);
						state.raw.numplayers = reader.uint(1);
						state.maxplayers = reader.uint(1);

						if(self.goldsrc) state.raw.protocol = reader.uint(1);
						else state.raw.numbots = reader.uint(1);

						state.raw.listentype = String.fromCharCode(reader.uint(1));
						state.raw.environment = String.fromCharCode(reader.uint(1));
						state.password = reader.uint(1);
						if(self.goldsrc) {
							state.raw.ismod = reader.uint(1);
							if(state.raw.ismod) {
								state.raw.modlink = reader.string();
								state.raw.moddownload = reader.string();
								reader.skip(1);
								state.raw.modversion = reader.uint(4);
								state.raw.modsize = reader.uint(4);
								state.raw.modtype = reader.uint(1);
								state.raw.moddll = reader.uint(1);
							}
						}
						state.raw.secure = reader.uint(1);

						if(self.goldsrc) {
							state.raw.numbots = reader.uint(1);
						} else {
							if(state.raw.folder == 'ship') {
								state.raw.shipmode = reader.uint(1);
								state.raw.shipwitnesses = reader.uint(1);
								state.raw.shipduration = reader.uint(1);
							}
							state.raw.version = reader.string();
							var extraFlag = reader.uint(1);
							if(extraFlag & 0x80) state.raw.port = reader.uint(2);
							if(extraFlag & 0x10) state.raw.steamid = reader.uint(8);
							if(extraFlag & 0x40) {
								state.raw.sourcetvport = reader.uint(2);
								state.raw.sourcetvname = reader.string();
							}
							if(extraFlag & 0x20) state.raw.tags = reader.string();
							if(extraFlag & 0x01) state.raw.gameid = reader.uint(8);
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
					for(var i = 0; i < num; i++) {
						reader.skip(1);
						var name = reader.string();
						var score = reader.uint(4);
						var time = reader.float();

						// connecting players don't could as players.
						if(!name) continue;

						(time == -1 ? state.bots : state.players).push({
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
					state.raw.rules = [];
					for(var i = 0; i < num; i++) {
						var key = reader.string();
						var value = reader.string();
						state.raw.rules[key] = value;
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

		var numPackets = 0;
		var packets = [];
		var bzip = false;
		this.udpSend(b,function(buffer) {
			var header = buffer.readInt32LE(0);
			if(header == -1) {
				// full package
				return received(buffer.slice(4));
			}
			if(header == -2) {
				// partial package
				var uid = buffer.readUInt32LE(4);
				if(!self.goldsrc && uid & 0x80000000) bzip = true;

				var id,payload;
				if(self.goldsrc) {
					id = buffer.readUInt8(8);
					numPackets = id & 0x0f;
					id = id & 0xf0 >> 4;
					payload = buffer.slice(9);
				} else {
					numPackets = buffer.readUInt8(8);
					id = buffer.readUInt8(9);
					if(id == 0 && bzip) payload = buffer.slice(20);
					else payload = buffer.slice(12);
				}

				packets[id] = payload;

				if(!numPackets || Object.keys(packets).length != numPackets) return;

				// assemble the parts
				var list = [];
				for(var i = 0; i < numPackets; i++) {
					if(!(i in packets)) {
						self.error('Missing packet #'+i);
						return true;
					}
					list.push(packets[i]);
				}
				var assembled = Buffer.concat(list);
				var payload = assembled.slice(4);
				if(bzip) payload = Bzip2.uncompressFile(payload);

				return received(payload);
			}
		});
	}
});
