import Iconv from 'iconv-lite'
import Long from 'long'
import { Buffer } from 'node:buffer'
import Varint from 'varint'

function readUInt64BE (buffer, offset) {
  const high = buffer.readUInt32BE(offset)
  const low = buffer.readUInt32BE(offset + 4)
  return new Long(low, high, true)
}
function readUInt64LE (buffer, offset) {
  const low = buffer.readUInt32LE(offset)
  const high = buffer.readUInt32LE(offset + 4)
  return new Long(low, high, true)
}

export default class Reader {
  /**
     * @param {Core} query
     * @param {Buffer} buffer
     **/
  constructor (query, buffer) {
    this.defaultEncoding = query.options.encoding || query.encoding
    this.defaultDelimiter = query.delimiter
    this.defaultByteOrder = query.byteorder
    this.buffer = buffer
    this.i = 0
  }

  setOffset (offset) {
    this.i = offset
  }

  offset () {
    return this.i
  }

  skip (i) {
    this.i += i
  }

  pascalString (bytesForSize, adjustment = 0) {
    const length = this.uint(bytesForSize) + adjustment
    return this.string(length)
  }

  string (arg) {
    let encoding = this.defaultEncoding
    let length = null
    let delimiter = this.defaultDelimiter

    if (typeof arg === 'string') delimiter = arg
    else if (typeof arg === 'number') length = arg
    else if (typeof arg === 'object') {
      if ('encoding' in arg) encoding = arg.encoding
      if ('length' in arg) length = arg.length
      if ('delimiter' in arg) delimiter = arg.delimiter
    }

    if (encoding === 'latin1') encoding = 'win1252'

    const start = this.i
    let end = start
    if (length === null) {
      // terminated by the delimiter
      let delim = delimiter
      if (typeof delim === 'string') delim = delim.charCodeAt(0)
      while (true) {
        if (end >= this.buffer.length) {
          end = this.buffer.length
          break
        }
        if (this.buffer.readUInt8(end) === delim) break
        end++
      }
      this.i = end + 1
    } else if (length <= 0) {
      return ''
    } else {
      end = start + length
      if (end >= this.buffer.length) {
        end = this.buffer.length
      }
      this.i = end
    }

    const slice = this.buffer.slice(start, end)
    const enc = encoding
    if (enc === 'utf8' || enc === 'ucs2' || enc === 'binary') {
      return slice.toString(enc)
    } else {
      return Iconv.decode(slice, enc)
    }
  }

  int (bytes) {
    let r = 0
    if (this.remaining() >= bytes) {
      if (this.defaultByteOrder === 'be') {
        if (bytes === 1) r = this.buffer.readInt8(this.i)
        else if (bytes === 2) r = this.buffer.readInt16BE(this.i)
        else if (bytes === 4) r = this.buffer.readInt32BE(this.i)
      } else {
        if (bytes === 1) r = this.buffer.readInt8(this.i)
        else if (bytes === 2) r = this.buffer.readInt16LE(this.i)
        else if (bytes === 4) r = this.buffer.readInt32LE(this.i)
      }
    }
    this.i += bytes
    return r
  }

  /** @returns {number} */
  uint (bytes) {
    let r = 0
    if (this.remaining() >= bytes) {
      if (this.defaultByteOrder === 'be') {
        if (bytes === 1) r = this.buffer.readUInt8(this.i)
        else if (bytes === 2) r = this.buffer.readUInt16BE(this.i)
        else if (bytes === 4) r = this.buffer.readUInt32BE(this.i)
        else if (bytes === 8) r = readUInt64BE(this.buffer, this.i)
      } else {
        if (bytes === 1) r = this.buffer.readUInt8(this.i)
        else if (bytes === 2) r = this.buffer.readUInt16LE(this.i)
        else if (bytes === 4) r = this.buffer.readUInt32LE(this.i)
        else if (bytes === 8) r = readUInt64LE(this.buffer, this.i)
      }
    }
    this.i += bytes
    return r
  }

  float () {
    let r = 0
    if (this.remaining() >= 4) {
      if (this.defaultByteOrder === 'be') r = this.buffer.readFloatBE(this.i)
      else r = this.buffer.readFloatLE(this.i)
    }
    this.i += 4
    return r
  }

  varint () {
    const out = Varint.decode(this.buffer, this.i)
    this.i += Varint.decode.bytes
    return out
  }

  /** @returns Buffer */
  part (bytes) {
    let r
    if (this.remaining() >= bytes) {
      r = this.buffer.slice(this.i, this.i + bytes)
    } else {
      r = Buffer.from([])
    }
    this.i += bytes
    return r
  }

  remaining () {
    return this.buffer.length - this.i
  }

  rest () {
    return this.buffer.slice(this.i)
  }

  done () {
    return this.i >= this.buffer.length
  }
}
