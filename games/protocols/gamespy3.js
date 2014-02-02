var async = require('async');

module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.sessionId = 1;
		this.encoding = 'latin1';
		this.byteorder = 'be';
		this.noChallenge = false;
		this.useOnlySingleSplit = false;
	},
	run: function(state) {
		var self = this;
		var challenge,packets;

		async.series([
			function(c) {
				if(self.noChallenge) return c();
				self.sendPacket(9,false,false,false,function(buffer) {
					var reader = self.reader(buffer);
					challenge = parseInt(reader.string());
					c();
				});
			},
			function(c) {
				self.sendPacket(0,challenge,new Buffer([0xff,0xff,0xff,0x01]),true,function(b) {
					packets = b;
					c();
				});
			},
			function(c) {
				// iterate over the received packets
				// the first packet will start off with k/v pairs, followed with data fields
				// the following packets will only have data fields
				var data = {};

				for(var iPacket = 0; iPacket < packets.length; iPacket++) {
					var packet = packets[iPacket];
					var reader = self.reader(packet);

					if(self.debug) {
						console.log("+++"+packet.toString('hex'));
						console.log(":::"+packet.toString('ascii'));
					}

					if(iPacket == 0) {
						while(!reader.done()) {
							var key = reader.string();
							if(!key) break;
							var value = reader.string();
							
							// reread the next line if we hit the weird ut3 bug
							if(value == 'p1073741829') value = reader.string();

							state.raw[key] = value;
						}
					}

					var firstMode = true;
					while(!reader.done()) {
						var mode = reader.string();
						if(mode.charCodeAt(0) <= 2) mode = mode.substring(1);
						if(!mode) continue;
						var offset = 0;
						if(iPacket != 0 && firstMode) offset = reader.uint(1);
						reader.skip(1);
						firstMode = false;

						while(!reader.done()) {
							var item = reader.string();
							if(!item) break;

							if(
								mode == 'player_'
								|| mode == 'score_'
								|| mode == 'ping_'
								|| mode == 'team_'
								|| mode == 'deaths_'
								|| mode == 'pid_'
							) {
								if(state.players.length <= offset)
									state.players.push({});
							}
							if(mode == 'player_') state.players[offset].name = item;
							if(mode == 'score_') state.players[offset].score = parseInt(item);
							if(mode == 'ping_') state.players[offset].ping = parseInt(item);
							if(mode == 'team_') state.players[offset].team = parseInt(item);
							if(mode == 'deaths_') state.players[offset].deaths = parseInt(item);
							if(mode == 'pid_') state.players[offset].pid = item;
							offset++;
						}
					}
				}

				if('hostname' in state.raw) state.name = state.raw.hostname;
				else if('servername' in state.raw) state.name = state.raw.servername;
				if('mapname' in state.raw) state.map = state.raw.mapname;
				if(state.raw.password == '1') state.password = true;
				if('maxplayers' in state.raw) state.maxplayers = parseInt(state.raw.maxplayers);

				self.finish(state);
			}
		]);
	},
	sendPacket: function(type,challenge,payload,assemble,c) {
		var self = this;

		var challengeLength = (this.noChallenge || challenge === false) ? 0 : 4;
		var payloadLength = payload ? payload.length : 0;

		var b = new Buffer(7 + challengeLength + payloadLength);
		b.writeUInt8(0xFE, 0);
		b.writeUInt8(0xFD, 1);
		b.writeUInt8(type, 2);
		b.writeUInt32BE(this.sessionId, 3);
		if(challengeLength) b.writeInt32BE(challenge, 7);
		if(payloadLength) payload.copy(b, 7+challengeLength);

		var numPackets = 0;
		var packets = {};
		this.udpSend(b,function(buffer) {
			var iType = buffer.readUInt8(0);
			if(iType != type) return;
			var iSessionId = buffer.readUInt32BE(1);
			if(iSessionId != self.sessionId) return;

			if(!assemble) {
				c(buffer.slice(5));
				return true;
			}
			if(self.useOnlySingleSplit) {
				// has split headers, but they are worthless and only one packet is used
				c([buffer.slice(16)]);
				return true;
			}

			var id = buffer.readUInt16LE(14);
			var last = (id & 0x80);
			id = id & 0x7f;
			if(last) numPackets = id+1;

			packets[id] = buffer.slice(16);
			if(self.debug) {
				console.log("Received packet #"+id);
				if(last) console.log("(last)");
			}

			if(!numPackets || Object.keys(packets).length != numPackets) return;
			
			// assemble the parts
			var list = [];
			for(var i = 0; i < numPackets; i++) {
				if(!(i in packets)) {
					self.fatal('Missing packet #'+i);
					return true;
				}
				list.push(packets[i]);
			}
			c(list);
			return true;
		});
	}
});
