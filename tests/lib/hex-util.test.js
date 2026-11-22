import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { debugDump } from '../../lib/HexUtil.js'

describe('HexUtil.debugDump', () => {
  it('reports the buffer length', () => {
    const out = debugDump(Buffer.from([0x00, 0x01, 0x02]))
    assert.match(out, /Buffer length: 3 bytes/)
  })

  it('includes the hex representation of each byte', () => {
    const out = debugDump(Buffer.from([0xde, 0xad, 0xbe, 0xef]))
    assert.match(out, /de ad be ef/)
  })

  it('renders printable ASCII in the character line and masks control bytes', () => {
    const out = debugDump(Buffer.from('A\x00B'))
    // Printable characters survive...
    assert.ok(out.includes('A'))
    assert.ok(out.includes('B'))
    // ...and the hex of the null byte is present
    assert.match(out, /41 00 42/)
  })

  it('handles an empty buffer without throwing', () => {
    const out = debugDump(Buffer.from([]))
    assert.match(out, /Buffer length: 0 bytes/)
  })
})
