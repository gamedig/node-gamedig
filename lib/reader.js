var Iconv = require('iconv-lite'),
	Long = require('long');

function readUInt64BE(buffer,offset) {
	var high = buffer.readUInt32BE(offset);
	var low = buffer.readUInt32BE(offset+4);
	return new Long(low,high,true);
}
function readUInt64LE(buffer,offset) {
	var low = buffer.readUInt32LE(offset);
	var high = buffer.readUInt32LE(offset+4);
	return new Long(low,high,true);
}

function Reader(query,buffer) {
	this.query = query;
	this.buffer = buffer;
	this.i = 0;
}

Reader.prototype = {
	offset: function() { return this.i; },
	skip: function(i) { this.i += i; },
	string: function() {
		var args = Array.prototype.slice.call(arguments);
		var options = {};
		if(args.length == 0) {
			options = {};
		} else if(args.length == 1) {
			if(typeof args[0] == 'string') options = { delimiter: args[0] };
			else if(typeof args[0] == 'number') options = { length: args[0] };
			else options = args[0];
		}

		options.encoding = options.encoding || this.query.encoding;
		if(options.encoding == 'latin1') options.encoding = 'win1252';

		var start = this.i+0;
		var end = start;
		if(!('length' in options)) {
			// terminated by the delimiter
			var delim = options.delimiter || this.query.delimiter;
			if(typeof delim == 'string') delim = delim.charCodeAt(0);
			while(true) {
				if(end >= this.buffer.length) return '';
				if(this.buffer.readUInt8(end) == delim) break;
				end++;
			}
			this.i = end+1;
		} else {
			end = start+options.length;
			if(end > this.buffer.length) return '';
			this.i = end;
		}

		var out = this.buffer.slice(start, end);
		var enc = options.encoding;
		if(enc == 'utf8' || enc == 'ucs2' || enc == 'binary') {
			out = out.toString(enc);
		} else {
			out = Iconv.decode(out,enc);
		}
		return out;
	},
	int: function(bytes) {
		var r = 0;
		if(this.i+bytes <= this.buffer.length) {
			if(this.query.byteorder == 'be') {
				if(bytes == 1) r = this.buffer.readInt8(this.i);
				else if(bytes == 2) r = this.buffer.readInt16BE(this.i);
				else if(bytes == 4) r = this.buffer.readInt32BE(this.i);
			} else {
				if(bytes == 1) r = this.buffer.readInt8(this.i);
				else if(bytes == 2) r = this.buffer.readInt16LE(this.i);
				else if(bytes == 4) r = this.buffer.readInt32LE(this.i);
			}
		}
		this.i += bytes;
		return r;
	},
	uint: function(bytes) {
		var r = 0;
		if(this.i+bytes <= this.buffer.length) {
			if(this.query.byteorder == 'be') {
				if(bytes == 1) r = this.buffer.readUInt8(this.i);
				else if(bytes == 2) r = this.buffer.readUInt16BE(this.i);
				else if(bytes == 4) r = this.buffer.readUInt32BE(this.i);
				else if(bytes == 8) r = readUInt64BE(this.buffer,this.i).toString();
			} else {
				if(bytes == 1) r = this.buffer.readUInt8(this.i);
				else if(bytes == 2) r = this.buffer.readUInt16LE(this.i);
				else if(bytes == 4) r = this.buffer.readUInt32LE(this.i);
				else if(bytes == 8) r = readUInt64LE(this.buffer,this.i).toString();
			}
		}
		this.i += bytes;
		return r;
	},
	float: function() {
		var r = 0;
		if(this.i+4 <= this.buffer.length) {
			if(this.query.byteorder == 'be') r = this.buffer.readFloatBE(this.i);
			else r = this.buffer.readFloatLE(this.i);
		}
		this.i += 4;
		return r;
	},
	done: function() {
		return this.i >= this.buffer.length;
	}
};

module.exports = Reader;
