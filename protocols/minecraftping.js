var varint = require('varint'),
	async = require('async');

function varIntBuffer(num) {
	return new Buffer(varint.encode(num));
}
function buildPacket(id,data) {
	if(!data) data = new Buffer(0);
	var idBuffer = varIntBuffer(id);
	return Buffer.concat([
		varIntBuffer(data.length+idBuffer.length),
		idBuffer,
		data
	]);
}

module.exports = require('./core').extend({
	run: function(state) {
		var self = this;
		var receivedData;

		async.series([
			function(c) {
				// build and send handshake and status TCP packet

				var portBuf = new Buffer(2);
				portBuf.writeUInt16BE(self.options.port_query,0);

				var addressBuf = new Buffer(self.options.address,'utf8');

				var bufs = [
					varIntBuffer(4),
					varIntBuffer(addressBuf.length),
					addressBuf,
					portBuf,
					varIntBuffer(1)
				];

				var outBuffer = Buffer.concat([
					buildPacket(0,Buffer.concat(bufs)),
					buildPacket(0)
				]);

				self.tcpSend(outBuffer, function(data) {
					if(data.length < 10) return false;
					var expected = varint.decode(data);
					data = data.slice(varint.decode.bytes);
					if(data.length < expected) return false;
					receivedData = data;
					c();
					return true;
				});
			},
			function(c) {
				// parse response

				var data = receivedData;
				var packetId = varint.decode(data);
				if(self.debug) console.log("Packet ID: "+packetId);
				data = data.slice(varint.decode.bytes);

				var strLen = varint.decode(data);
				if(self.debug) console.log("String Length: "+strLen);
				data = data.slice(varint.decode.bytes);

				var str = data.toString('utf8');
				if(self.debug) {
					console.log(str);
				}

				var json;
				try {
					json = JSON.parse(str);
					delete json.favicon;
				} catch(e) {
					return self.fatal('Invalid JSON');
				}

				state.raw.version = json.version.name;
				state.maxplayers = json.players.max;
				state.raw.description = json.description.text;
				if(json.players.sample) {
					for(var i = 0; i < json.players.sample.length; i++) {
						state.players.push({
							id: json.players.sample[i].id,
							name: json.players.sample[i].name
						});
					}
				}
				while(state.players.length < json.players.online) {
					state.players.push({});
				}

				self.finish(state);
			}
		]);
	}
});
