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
					state.raw.ip = self.readUnrealString(reader);
					state.raw.port = reader.uint(4);
					state.raw.queryport = reader.uint(4);
					state.name = self.readUnrealString(reader,true);
					self.readUnrealString(reader); // unknown?
					state.map = self.readUnrealString(reader,true);
					state.raw.gametype = self.readUnrealString(reader,true);
					self.readExtraInfo(reader,state);

					c();
				});
			},
			function(c) {
				self.sendPacket(1,true,function(b) {
					var reader = self.reader(b);
					state.raw.mutators = [];
					state.raw.rules = {};
					while(!reader.done()) {
						var key = self.readUnrealString(reader,true);
						var value = self.readUnrealString(reader,true);
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
						var name = self.readUnrealString(reader,true);
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
	readExtraInfo: function(reader,state) {
		if(this.debug) {
			console.log("UNREAL2 EXTRA INFO:");
			console.log(reader.uint(4));
			console.log(reader.uint(4));
			console.log(reader.uint(4));
			console.log(reader.uint(4));
			console.log(reader.buffer.slice(reader.i));
		}
	},
	readUnrealString: function(reader, stripColor) {
		var length = reader.uint(1);
		var out;
		if(length < 0x80) {
			out = reader.string({length:length});
		} else {
			length = (length&0x7f)*2;
			out = length+reader.string({encoding:'ucs2',length:length});
		}
		
		if(out.charCodeAt(out.length-1) == 0)
			out = out.substring(0,out.length-1);
		
		if(stripColor)
			out = out.replace(/\x1b...|[\x00-\x1a]/g,'');

		return out;
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
