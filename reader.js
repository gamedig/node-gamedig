var Iconv = require('iconv').Iconv;
var Iconv_converters = {};
function getIconv(from) {
	var to = 'utf-8';
	var key = from+'---'+to;
	if(!(key in Iconv_converters)) {
		Iconv_converters[key] = new Iconv(from, to);
	}
	return Iconv_converters[key];
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
		if(options.encoding == 'latin1') options.encoding = 'windows-1252';

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
			if(options.stripnull && this.buffer.readUInt8(end-1) == 0) end--;
		}

		var out = this.buffer.slice(start, end);
		var enc = options.encoding;
		if(enc == 'utf8' || enc == 'ucs2' || enc == 'binary') {
			out = out.toString(enc);
		} else {
			var converter = getIconv(enc);
			out = converter.convert(out).toString();
		}
		return out;
	},
	uint: function(bytes) {
		var r = 0;
		if(this.i+bytes <= this.buffer.length) {
			if(this.query.byteorder == 'be') {
				if(bytes == 1) r = this.buffer.readUInt8(this.i);
				else if(bytes == 2) r = this.buffer.readUInt16BE(this.i);
				else if(bytes == 4) r = this.buffer.readUInt32BE(this.i);
				else if(bytes == 8) r = Bignum.fromBuffer(this.buffer.slice(this.i,this.i+8),{endian:'big',size:'auto'});
			} else {
				if(bytes == 1) r = this.buffer.readUInt8(this.i);
				else if(bytes == 2) r = this.buffer.readUInt16LE(this.i);
				else if(bytes == 4) r = this.buffer.readUInt32LE(this.i);
				else if(bytes == 8) r = Bignum.fromBuffer(this.buffer.slice(this.i,this.i+8),{endian:'little',size:'auto'});
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
	pascal: function(enc) {
		if(this.i >= this.buffer.length) return '';
		var length = this.buffer.readUInt8(this.i);
		this.i++;
		return this.string({
			encoding: enc,
			length: length,
			stripnull: true
		});
	},
	done: function() {
		return this.i >= this.buffer.length;
	}
};

module.exports = Reader;
