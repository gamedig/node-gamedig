var async = require('async'),
	Bzip2 = require('compressjs').Bzip2;

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.goldsrc = false;
		this.legacyChallenge = false;
		this.options.port = 27015;
		
		// 2006 engines don't pass packet switching size in split packet header
		// while all others do
		this._skipSizeInSplitHeader = false;

		this._challenge = '';
	},
	run: function(state) {
		var self = this;
		async.series([
			function(c) { self.queryInfo(state,c); },
			function(c) { self.queryChallenge(state,c); },
			function(c) { self.queryPlayers(state,c); },
			function(c) { self.queryRules(state,c); },
			function(c) { self.finish(state); }
		]);
	},
	queryInfo: function(state,c) {
		var self = this;
		self.sendPacket(
			0x54,false,'Source Engine Query\0',
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

				state.raw.listentype = reader.uint(1);
				state.raw.environment = reader.uint(1);
				if(!self.goldsrc) {
					state.raw.listentype = String.fromCharCode(state.raw.listentype);
					state.raw.environment = String.fromCharCode(state.raw.environment);
				}

				state.password = !!reader.uint(1);
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

				if(state.raw.protocol == 7 && state.raw.steamappid == 215) {
					self._skipSizeInSplitHeader = true;
				}

				c();
			}
		);
	},
	queryChallenge: function(state,c) {
		var self = this;
		if(this.legacyChallenge) {
			self.sendPacket(0x57,false,false,0x41,function(b) {
				var reader = self.reader(b);
				self._challenge = reader.uint(4);
				c();
			});
		} else {
			self.sendPacket(self.goldsrc?0x56:0x55,0xffffffff,false,0x41,function(b) {
				var reader = self.reader(b);
				self._challenge = reader.uint(4);
				c();
			});
		}
	},
	queryPlayers: function(state,c) {
		var self = this;
		self.sendPacket(0x55,true,false,0x44,function(b) {
			var reader = self.reader(b);
			var num = reader.uint(1);
			for(var i = 0; i < num; i++) {
				reader.skip(1);
				var name = reader.string();
				var score = reader.int(4);
				var time = reader.float();

				// connecting players don't could as players.
				if(!name) continue;

				(time == -1 ? state.bots : state.players).push({
					name:name, score:score, time:time
				});
			}
			
			// if we didn't find the bots, iterate
			// through and guess which ones they are
			if(!state.bots.length && state.raw.numbots) {
				var maxTime = 0;
				state.players.forEach(function(player) {
					maxTime = Math.max(player.time,maxTime);
				});
				for(var i = 0; i < state.players.length; i++) {
					var player = state.players[i];
					if(state.bots.length >= state.raw.numbots) continue;
					if(player.time != maxTime) continue;
					state.bots.push(player);
					state.players.splice(i, 1);
					i--;
				}
			}

			c();
		});
	},
	queryRules: function(state,c) {
		var self = this;
		self.sendPacket(0x56,true,false,0x45,function(b) {
			var reader = self.reader(b);
			var num = reader.uint(2);
			state.raw.rules = {};
			for(var i = 0; i < num; i++) {
				var key = reader.string();
				var value = reader.string();
				state.raw.rules[key] = value;
			}
			c();
		}, function() {
			// no rules were returned after timeout --
			// the server probably has them disabled
			// ignore the timeout
			c();
			return true;
		});
	},
	sendPacket: function(type,sendChallenge,payload,expect,callback,ontimeout) {
		var self = this;

		if(typeof payload == 'string') payload = new Buffer(payload);
		var challengeLength = sendChallenge !== false ? 4 : 0;
		var payloadLength = payload ? payload.length : 0;

		var b = new Buffer(5 + challengeLength + payloadLength);
		b.writeInt32LE(-1, 0);
		b.writeUInt8(type, 4);
		
		if(sendChallenge !== false) {
			var challenge = this._challenge;
			if(typeof sendChallenge == 'number') challenge = sendChallenge;
			if(self.byteorder == 'le') b.writeUInt32LE(challenge, 5);
			else b.writeUInt32BE(challenge, 5);
		}
		if(payloadLength) payload.copy(b, 5+challengeLength);

		function received(payload) {
			var type = payload.readUInt8(0);
			if(self.debug) console.log("Received "+type+" expected "+expect);
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
					id = (id & 0xf0) >> 4;
					payload = buffer.slice(9);
				} else {
					numPackets = buffer.readUInt8(8);
					id = buffer.readUInt8(9);
					var sizeOffset = self._skipSizeInSplitHeader ? 0 : 2;
					if(id == 0 && bzip) payload = buffer.slice(18+sizeOffset);
					else payload = buffer.slice(10+sizeOffset);
				}

				packets[id] = payload;
				
				if(self.debug) {
					console.log("Received partial packet id: "+id);
					console.log("Expecting "+numPackets+" packets, have "+Object.keys(packets).length);
					console.log("Bzip? "+bzip);
				}

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
				if(bzip) assembled = new Buffer(Bzip2.decompressFile(assembled));

				return received(assembled.slice(4));
			}
		},ontimeout);
	}
});
