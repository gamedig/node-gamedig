module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.sessionId = 1;
		this.encoding = 'latin1';
		this.byteorder = 'be';
	},
	run: function(state) {
		var self = this;

		this.sendPacket(9,false,false,false,function(buffer) {
			var reader = self.reader(buffer);
			reader.skip(5);
			var challenge = parseInt(reader.string());

			self.sendPacket(0,challenge,new Buffer([0xff,0xff,0xff,0x01]),true,function(buffer) {

				var reader = self.reader(buffer);

				while(!reader.done()) {
					var key = reader.string();
					if(!key) break;
					var value = reader.string();
					state.raw[key] = value;
				}
				
				var mode = '';
				while(!reader.done()) {
					var mode = reader.string();
					reader.skip(1);
					
					while(!reader.done()) {
						var item = reader.string();
						if(!item) break;
						
						if(mode.substr(-1) == '_') {
							// players
							state.players.push({name:item})
						}
					}
				}
				
				if('hostname' in state.raw) state.name = state.raw.hostname;
				if('map' in state.raw) state.map = state.raw.map;
				if('maxplayers' in state.raw) state.maxplayers = state.raw.maxplayers;

				self.finish(state);

			});
		});
	},
	sendPacket: function(type,challenge,payload,assemble,c) {
		var self = this;

		var challengeLength = challenge === false ? 0 : 4;
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
				c(buffer);
				return true;
			}

			var id = buffer.readUInt16LE(14);
			var last = (id & 0x80);
			id = id & 0x7f;
			if(last) numPackets = id+1;

			packets[id] = buffer.slice(16);

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
			c(assembled);
			return true;
		});
	}
});
