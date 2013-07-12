module.exports = require('./core').extend({
	init: function() {
		this._super();
		this.pretty = 'Armagetron';
		this.encoding = 'latin1';
		this.byteorder = 'be';
		this.options.port = 4534;
	},
	run: function(state) {
		var self = this;

		var b = new Buffer([0,0x35,0,0,0,0,0,0x11]);

		this.udpSend(b,function(buffer) {
			var reader = self.reader(buffer);

			reader.skip(6);

			state.raw.port = self.readUInt(reader);
			state.raw.hostname = self.readString(reader,buffer);
			state.name = self.readString(reader,buffer);
			state.raw.numplayers = self.readUInt(reader);
			state.raw.versionmin = self.readUInt(reader);
			state.raw.versionmax = self.readUInt(reader);
			state.raw.version = self.readString(reader,buffer);
			state.maxplayers = self.readUInt(reader);

			var players = self.readString(reader,buffer);
			var list = players.split('\n');
			for(var i = 0; i < list.length; i++) {
				if(!list[i]) continue;
				state.players.push({name:list[i]});
			}

			state.raw.options = self.readString(reader,buffer);
			state.raw.uri = self.readString(reader,buffer);
			state.raw.globalids = self.readString(reader,buffer);
			self.finish(state);
			return true;
		});
	},
	readUInt: function(reader) {
		var a = reader.uint(2);
		var b = reader.uint(2);
		return (b<<16) + a;
	},
	readString: function(reader,b) {
		var len = reader.uint(2);
		if(!len) return '';

		var out = '';
		for(var i = 0; i < len; i+=2) {
			var hi = reader.uint(1);
			var lo = reader.uint(1);
			if(i+1<len) out += String.fromCharCode(lo);
			if(i+2<len) out += String.fromCharCode(hi);
		}

		out = out.replace(/0x[0-9a-f]{6}/g,''); // strip color codes
		return out;
	}
});
