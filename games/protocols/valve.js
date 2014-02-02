var async = require('async'),
	Bzip2 = require('compressjs').Bzip2;

module.exports = require('./core').extend({
	init: function() {
		this._super();

		this.options.port = 27015;
		
		// legacy goldsrc info response -- basically not used by ANYTHING now,
		// as most (all?) goldsrc servers respond with the source info reponse
		// delete in a few years if nothing ends up using it anymore
		this.goldsrcInfo = false;
		
		// unfortunately, the split format from goldsrc is still around, but we
		// can detect that during the query
		this.goldsrcSplits = false;

		// some mods require a challenge, but don't provide them in the new format
		// at all, use the old dedicated challenge query if needed
		this.legacyChallenge = false;
		
		// 2006 engines don't pass packet switching size in split packet header
		// while all others do, this need is detected automatically
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
			self.goldsrcInfo ? 0x6D : 0x49,
			function(b) {
				var reader = self.reader(b);
				
				if(self.goldsrcInfo) state.raw.address = reader.string();
				else state.raw.protocol = reader.uint(1);

				state.name = reader.string();
				state.map = reader.string();
				state.raw.folder = reader.string();
				state.raw.game = reader.string();
				state.raw.steamappid = reader.uint(2);
				state.raw.numplayers = reader.uint(1);
				state.maxplayers = reader.uint(1);

				if(self.goldsrcInfo) state.raw.protocol = reader.uint(1);
				else state.raw.numbots = reader.uint(1);

				state.raw.listentype = reader.uint(1);
				state.raw.environment = reader.uint(1);
				if(!self.goldsrcInfo) {
					state.raw.listentype = String.fromCharCode(state.raw.listentype);
					state.raw.environment = String.fromCharCode(state.raw.environment);
				}

				state.password = !!reader.uint(1);
				if(self.goldsrcInfo) {
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

				if(self.goldsrcInfo) {
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

				// from https://developer.valvesoftware.com/wiki/Server_queries
				if(
					state.raw.protocol == 7 && (
						state.raw.steamappid == 215
						|| state.raw.steamappid == 17550
						|| state.raw.steamappid == 17700
						|| state.raw.steamappid == 240
					)
				) {
					self._skipSizeInSplitHeader = true;
				}
				if(self.debug) {
					console.log("STEAM APPID: "+state.raw.steamappid);
					console.log("PROTOCOL: "+state.raw.protocol);
				}
				if(state.raw.protocol == 48) {
					if(self.debug) console.log("GOLDSRC DETECTED - USING MODIFIED SPLIT FORMAT");
					self.goldsrcSplits = true;
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
			c();
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

				// connecting players don't count as players.
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
		var packetStorage = {};
		
		send();

		function send(c) {
			if(typeof payload == 'string') payload = new Buffer(payload,'binary');
			var challengeLength = sendChallenge ? 4 : 0;
			var payloadLength = payload ? payload.length : 0;

			var b = new Buffer(5 + challengeLength + payloadLength);
			b.writeInt32LE(-1, 0);
			b.writeUInt8(type, 4);
			
			if(sendChallenge) {
				var challenge = self._challenge;
				if(!challenge) challenge = 0xffffffff;
				if(self.byteorder == 'le') b.writeUInt32LE(challenge, 5);
				else b.writeUInt32BE(challenge, 5);
			}
			if(payloadLength) payload.copy(b, 5+challengeLength);

			self.udpSend(b,receivedOne,ontimeout);
		}

		function receivedOne(buffer) {
			var reader = self.reader(buffer);

			var header = reader.int(4);
			if(header == -1) {
				// full package
				if(self.debug) console.log("Received full packet");
				return receivedFull(reader);
			}
			if(header == -2) {
				// partial package
				var uid = reader.uint(4);
				if(!(uid in packetStorage)) packetStorage[uid] = {};
				var packets = packetStorage[uid];

				var bzip = false;
				if(!self.goldsrcSplits && uid & 0x80000000) bzip = true;

				var packetNum,payload,numPackets;
				if(self.goldsrcSplits) {
					packetNum = reader.uint(1);
					numPackets = packetNum & 0x0f;
					packetNum = (packetNum & 0xf0) >> 4;
					payload = reader.rest();
				} else {
					numPackets = reader.uint(1);
					packetNum = reader.uint(1);
					if(!self._skipSizeInSplitHeader) reader.skip(2);
					if(packetNum == 0 && bzip) reader.skip(8);
					payload = reader.rest();
				}

				packets[packetNum] = payload;
				
				if(self.debug) {
					console.log("Received partial packet uid:"+uid+" num:"+packetNum);
					console.log("Received "+Object.keys(packets).length+'/'+numPackets+" packets for this UID");
				}

				if(Object.keys(packets).length != numPackets) return;

				// assemble the parts
				var list = [];
				for(var i = 0; i < numPackets; i++) {
					if(!(i in packets)) {
						self.fatal('Missing packet #'+i);
						return true;
					}
					list.push(packets[i]);
				}

				var assembled = Buffer.concat(list);
				if(bzip) {
					if(self.debug) console.log("BZIP DETECTED - Extracing packet...");
					try {
						assembled = new Buffer(Bzip2.decompressFile(assembled));
					} catch(e) {
						self.fatal('Invalid bzip packet');
						return true;
					}
				}
				var assembledReader = self.reader(assembled);
				assembledReader.skip(4); // header
				return receivedFull(assembledReader);
			}
		}

		function receivedFull(reader) {
			var type = reader.uint(1);
			
			if(type == 0x41) {
				if(self.debug) console.log('Received challenge key');
				if(self._challenge) return self.fatal('Received more than one challenge key');
				self._challenge = reader.uint(4);
				
				if(self.debug) console.log('Restarting query');
				send();
				return true;
			}
			
			if(self.debug) console.log("Received "+type.toString(16)+" expected "+expect.toString(16));
			if(type != expect) return;
			callback(reader.rest());
			return true;
		}
	}
});
