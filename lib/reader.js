const Iconv = require('iconv-lite'),
    Long = require('long');

function readUInt64BE(buffer,offset) {
    const high = buffer.readUInt32BE(offset);
    const low = buffer.readUInt32BE(offset+4);
    return new Long(low,high,true);
}
function readUInt64LE(buffer,offset) {
    const low = buffer.readUInt32LE(offset);
    const high = buffer.readUInt32LE(offset+4);
    return new Long(low,high,true);
}

class Reader {
    constructor(query,buffer) {
        this.query = query;
        this.buffer = buffer;
        this.i = 0;
    }

    offset() {
        return this.i;
    }

    skip(i) {
        this.i += i;
    }

    string(...args) {
        let options = {};
        if(args.length === 0) {
            options = {};
        } else if(args.length === 1) {
            if(typeof args[0] === 'string') options = { delimiter: args[0] };
            else if(typeof args[0] === 'number') options = { length: args[0] };
            else options = args[0];
        }

        options.encoding = options.encoding || this.query.encoding;
        if(options.encoding === 'latin1') options.encoding = 'win1252';

        const start = this.i+0;
        let end = start;
        if(!('length' in options)) {
            // terminated by the delimiter
            let delim = options.delimiter || this.query.delimiter;
            if(typeof delim === 'string') delim = delim.charCodeAt(0);
            while(true) {
                if(end >= this.buffer.length) {
                    end = this.buffer.length;
                    break;
                }
                if(this.buffer.readUInt8(end) === delim) break;
                end++;
            }
            this.i = end+1;
        } else {
            end = start+options.length;
            if(end >= this.buffer.length) {
                end = this.buffer.length;
            }
            this.i = end;
        }

        let out = this.buffer.slice(start, end);
        const enc = options.encoding;
        if(enc === 'utf8' || enc === 'ucs2' || enc === 'binary') {
            out = out.toString(enc);
        } else {
            out = Iconv.decode(out,enc);
        }
        return out;
    }

    int(bytes) {
        let r = 0;
        if(this.remaining() >= bytes) {
            if(this.query.byteorder === 'be') {
                if(bytes === 1) r = this.buffer.readInt8(this.i);
                else if(bytes === 2) r = this.buffer.readInt16BE(this.i);
                else if(bytes === 4) r = this.buffer.readInt32BE(this.i);
            } else {
                if(bytes === 1) r = this.buffer.readInt8(this.i);
                else if(bytes === 2) r = this.buffer.readInt16LE(this.i);
                else if(bytes === 4) r = this.buffer.readInt32LE(this.i);
            }
        }
        this.i += bytes;
        return r;
    }

    /** @returns {number} */
    uint(bytes) {
        let r = 0;
        if(this.remaining() >= bytes) {
            if(this.query.byteorder === 'be') {
                if(bytes === 1) r = this.buffer.readUInt8(this.i);
                else if(bytes === 2) r = this.buffer.readUInt16BE(this.i);
                else if(bytes === 4) r = this.buffer.readUInt32BE(this.i);
                else if(bytes === 8) r = readUInt64BE(this.buffer,this.i).toString();
            } else {
                if(bytes === 1) r = this.buffer.readUInt8(this.i);
                else if(bytes === 2) r = this.buffer.readUInt16LE(this.i);
                else if(bytes === 4) r = this.buffer.readUInt32LE(this.i);
                else if(bytes === 8) r = readUInt64LE(this.buffer,this.i).toString();
            }
        }
        this.i += bytes;
        return r;
    }

    float() {
        let r = 0;
        if(this.remaining() >= 4) {
            if(this.query.byteorder === 'be') r = this.buffer.readFloatBE(this.i);
            else r = this.buffer.readFloatLE(this.i);
        }
        this.i += 4;
        return r;
    }

    part(bytes) {
        let r;
        if(this.remaining() >= bytes) {
            r = this.buffer.slice(this.i,this.i+bytes);
        } else {
            r = Buffer.from([]);
        }
        this.i += bytes;
        return r;
    }

    remaining() {
        return this.buffer.length-this.i;
    }

    rest() {
        return this.buffer.slice(this.i);
    }

    done() {
        return this.i >= this.buffer.length;
    }
}

module.exports = Reader;
