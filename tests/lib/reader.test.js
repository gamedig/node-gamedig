import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Reader from '../../lib/reader.js'

// Builds a Reader over a buffer without needing a live protocol/query. Mirrors
// the minimal surface the Reader reads from its `query` argument.
const makeReader = (buffer, opts = {}) => {
  const query = {
    options: {},
    encoding: opts.encoding ?? 'utf8',
    delimiter: opts.delimiter ?? '\0',
    byteorder: opts.byteorder ?? 'le'
  }
  return new Reader(query, buffer)
}

// Convenience: build a Buffer from a hex string.
const hex = (str) => Buffer.from(str, 'hex')

describe('Reader.string', () => {
  it('reads a fixed-length string and advances the offset', () => {
    const reader = makeReader(Buffer.from('hello world'))
    assert.equal(reader.string(5), 'hello')
    assert.equal(reader.offset(), 5)
  })

  it('reads a string terminated by the default null delimiter', () => {
    const reader = makeReader(Buffer.from('abc\0def\0'))
    assert.equal(reader.string(), 'abc')
    assert.equal(reader.string(), 'def')
  })

  it('reads a string terminated by a custom delimiter', () => {
    const reader = makeReader(Buffer.from('abc|def'))
    assert.equal(reader.string('|'), 'abc')
    assert.equal(reader.string('|'), 'def')
  })

  it('stops at the end of the buffer when no delimiter is found', () => {
    const reader = makeReader(Buffer.from('noterminator'))
    assert.equal(reader.string(), 'noterminator')
    assert.ok(reader.done())
  })

  it('returns an empty string for a non-positive length', () => {
    const reader = makeReader(Buffer.from('abc'))
    assert.equal(reader.string(0), '')
    assert.equal(reader.string(-5), '')
    // offset should not have moved
    assert.equal(reader.offset(), 0)
  })

  it('truncates a fixed-length read at the buffer boundary', () => {
    const reader = makeReader(Buffer.from('abc'))
    assert.equal(reader.string(100), 'abc')
  })

  it('honours an explicit encoding via the object form', () => {
    // 0x80 in Windows-1252 is the Euro sign
    const reader = makeReader(hex('80'))
    assert.equal(reader.string({ length: 1, encoding: 'win1252' }), '€')
  })

  it('maps the latin1 alias onto win1252', () => {
    const reader = makeReader(hex('80'), { encoding: 'latin1' })
    assert.equal(reader.string(1), '€')
  })
})

describe('Reader.pascalString', () => {
  it('reads a length-prefixed string', () => {
    const buffer = Buffer.concat([Buffer.from([5]), Buffer.from('hello')])
    const reader = makeReader(buffer)
    assert.equal(reader.pascalString(1), 'hello')
  })

  it('applies a length adjustment', () => {
    // stored length is 6, adjustment of -1 yields 5 bytes read
    const buffer = Buffer.concat([Buffer.from([6]), Buffer.from('hello!')])
    const reader = makeReader(buffer)
    assert.equal(reader.pascalString(1, -1), 'hello')
  })
})

describe('Reader.int / Reader.uint', () => {
  it('reads little-endian signed integers', () => {
    const reader = makeReader(hex('ff'))
    assert.equal(reader.int(1), -1)
  })

  it('reads 16-bit and 32-bit little-endian signed integers', () => {
    const reader = makeReader(hex('2c01' + '2c010000'))
    assert.equal(reader.int(2), 300)
    assert.equal(reader.int(4), 300)
  })

  it('reads big-endian signed integers', () => {
    const reader = makeReader(hex('ff' + '012c' + '0000012c'), { byteorder: 'be' })
    assert.equal(reader.int(1), -1)
    assert.equal(reader.int(2), 300)
    assert.equal(reader.int(4), 300)
  })

  it('reads little-endian unsigned integers', () => {
    const reader = makeReader(hex('ff'))
    assert.equal(reader.uint(1), 255)
  })

  it('reads 16-bit and 32-bit little-endian values', () => {
    const reader = makeReader(hex('0100' + '01000000'))
    assert.equal(reader.uint(2), 1)
    assert.equal(reader.uint(4), 1)
  })

  it('reads 16-bit and 32-bit big-endian values when configured', () => {
    const reader = makeReader(hex('0100' + '00000100'), { byteorder: 'be' })
    assert.equal(reader.uint(2), 256)
    assert.equal(reader.uint(4), 256)
  })

  it('reads a 64-bit unsigned value as a Long', () => {
    const reader = makeReader(hex('0100000000000000'))
    const value = reader.uint(8)
    assert.equal(value.toString(), '1')
  })

  it('reads a 64-bit big-endian unsigned value as a Long', () => {
    const reader = makeReader(hex('0000000000000100'), { byteorder: 'be' })
    assert.equal(reader.uint(8).toString(), '256')
  })

  it('returns 0 and still advances when not enough bytes remain', () => {
    const reader = makeReader(hex('01'))
    assert.equal(reader.uint(4), 0)
    assert.equal(reader.offset(), 4)
  })
})

describe('Reader.float', () => {
  it('reads a little-endian 32-bit float', () => {
    const buffer = Buffer.alloc(4)
    buffer.writeFloatLE(1.5, 0)
    const reader = makeReader(buffer)
    assert.equal(reader.float(), 1.5)
  })

  it('reads a big-endian 32-bit float when configured', () => {
    const buffer = Buffer.alloc(4)
    buffer.writeFloatBE(1.5, 0)
    const reader = makeReader(buffer, { byteorder: 'be' })
    assert.equal(reader.float(), 1.5)
  })
})

describe('Reader.varint', () => {
  it('decodes a multi-byte varint and advances correctly', () => {
    // 300 encodes to 0xAC 0x02
    const reader = makeReader(hex('ac02'))
    assert.equal(reader.varint(), 300)
    assert.ok(reader.done())
  })
})

describe('Reader.part / navigation', () => {
  it('slices a sub-buffer of the requested size', () => {
    const reader = makeReader(hex('aabbccdd'))
    assert.equal(reader.part(2).toString('hex'), 'aabb')
    assert.equal(reader.remaining(), 2)
  })

  it('returns an empty buffer when not enough bytes remain', () => {
    const reader = makeReader(hex('aa'))
    assert.equal(reader.part(4).length, 0)
  })

  it('supports skip, setOffset and rest', () => {
    const reader = makeReader(Buffer.from('0123456789'))
    reader.skip(2)
    assert.equal(reader.offset(), 2)
    reader.setOffset(8)
    // rest() returns the remaining bytes without advancing the offset
    assert.equal(reader.rest().toString(), '89')
    assert.equal(reader.offset(), 8)
    assert.equal(reader.done(), false)
  })

  it('reports done once the offset reaches the end of the buffer', () => {
    const reader = makeReader(Buffer.from('0123456789'))
    assert.equal(reader.done(), false)
    reader.setOffset(10)
    assert.ok(reader.done())
  })
})
