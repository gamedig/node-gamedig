var dns = require('dns'),
	net = require('net'),
	varint = require('varint');

function varIntBuffer(num) {
	return new Buffer(varint.encode(num));
}

module.exports = require('./protocols/core').extend({
	init: function() {
		this._super();
		this.pretty = 'Minecraft';
		this.options.port = 25565;
	},
	parseDns: function(host,c) {
		var self = this;
		var _super = this._super;
		function fallback(h) { _super.call(self,h,c); }

		dns.resolve('_minecraft._tcp.'+host, 'SRV', function(err,addresses) {
			if(err) return fallback(host);
			if(addresses.length >= 1) {
				var line = addresses[0];
				self.options.port = line.port;
				var srvhost = line.name;
				
				if(srvhost.match(/\d+\.\d+\.\d+\.\d+/)) {
					self.options.address = srvhost;
					c();
				} else {
					// resolve yet again
					fallback(srvhost);
				}
				return;
			}
			return fallback(host);
		});
	},
	reset: function() {
		this._super();
		if(this.socket) {
			this.socket.destroy();
			delete this.socket;
		}
	},
	run: function(state) {
		var self = this;
		
		var socket = this.socket = net.connect(
			this.options.port,
			this.options.address,
			function() {

			var portBuf = new Buffer(2);
			portBuf.writeUInt16BE(self.options.port,0);
			
			var addressBuf = new Buffer(self.options.address,'utf8');

			var bufs = [
				varIntBuffer(4),
				varIntBuffer(addressBuf.length),
				addressBuf,
				portBuf,
				varIntBuffer(1)
			];
			self.sendPacket(0,Buffer.concat(bufs));
			self.sendPacket(0);
		});
		socket.setTimeout(10000);
		socket.setNoDelay(true);
		
		var received = new Buffer(0);
		var expectedBytes = 0;
		socket.on('data', function(data) {
			received = Buffer.concat([received,data]);
			if(expectedBytes) {
				if(received.length >= expectedBytes) {
					self.allReceived(received,state);
				}
			} else if(received.length > 10) {
				expectedBytes = varint.decode(received);
				received = received.slice(varint.decode.bytesRead);
			}
		});
	},
	sendPacket: function(id,data) {
		if(!data) data = new Buffer(0);
		var idBuffer = varIntBuffer(id);
		var out = Buffer.concat([
			varIntBuffer(data.length+idBuffer.length),
			idBuffer,
			data
		]);
		this.socket.write(out);
	},
	allReceived: function(received,state) {
		var packetId = varint.decode(received);
		received = received.slice(varint.decode.bytesRead);
		
		var strLen = varint.decode(received);
		received = received.slice(varint.decode.bytesRead);

		var str = received.toString('utf8');
		var json;
		try {
			json = JSON.parse(str);
			delete json.favicon;
		} catch(e) {
			return this.fatal('Invalid JSON');
		}
		
		state.raw.version = json.version.name;
		state.maxplayers = json.players.max;
		state.raw.description = json.description.text;
		for(var i = 0; i < json.players.sample.length; i++) {
			state.players.push({
				id: json.players.sample[i].id,
				name: json.players.sample[i].name
			});
		}
		while(state.players.length < json.players.online) {
			state.players.push({});
		}
		
		this.finish(state);
	}
});
