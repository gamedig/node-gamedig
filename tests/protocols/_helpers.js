import { Buffer } from 'node:buffer'
import { Results } from '../../lib/Results.js'

// Small little-endian byte encoders for hand-building protocol fixtures.
// This file is intentionally not named *.test.js so the test runner skips it.
export const u8 = (n) => Buffer.from([n])
export const u16le = (n) => {
  const b = Buffer.alloc(2)
  b.writeUInt16LE(n)
  return b
}
export const i32le = (n) => {
  const b = Buffer.alloc(4)
  b.writeInt32LE(n)
  return b
}
export const f32le = (n) => {
  const b = Buffer.alloc(4)
  b.writeFloatLE(n)
  return b
}
// A null-terminated string, as used throughout the Valve/Source protocols.
export const cstr = (s) => Buffer.concat([Buffer.from(s, 'utf8'), Buffer.from([0])])
export const char = (c) => Buffer.from([c.charCodeAt(0)])

// A single-byte length-prefixed (Pascal) string. The default adjustment of +1
// matches the ASE format, whose stored length is (actual length + 1).
export const pstr = (s, lengthAdjust = 1) => {
  const body = Buffer.from(s, 'utf8')
  return Buffer.concat([u8(body.length + lengthAdjust), body])
}

// Backslash-delimited key/value buffer (the GameSpy1/Quake serverinfo format),
// e.g. backslashKV(['a', '1', 'b', '2']) => "\a\1\b\2".
export const backslashKV = (fields, encoding = 'latin1') =>
  Buffer.from('\\' + fields.join('\\'), encoding)

// Drives a protocol's run() against a fixed response buffer by replacing the
// single network method (udpSend) with one that invokes the real onPacket
// parser. Suitable for protocols that issue exactly one udpSend. No socket.
export const runWithUdpResponse = async (protocol, buffer, options = {}) => {
  protocol.options = options
  protocol.udpSend = async (_payload, onPacket) => onPacket(buffer)
  const state = new Results()
  await protocol.run(state)
  return state
}

// Drives a Valve-family protocol by stubbing sendPacket, answering each query
// with the buffer registered for the response type it expects (e.g. 0x49 for
// A2S_INFO). Unregistered types resolve to null (i.e. a timed-out query).
export const runWithPackets = async (protocol, responsesByExpect, options = {}) => {
  protocol.options = options
  protocol.sendPacket = async (type, payload, expect) =>
    (expect in responsesByExpect ? responsesByExpect[expect] : null)
  const state = new Results()
  await protocol.run(state)
  return state
}
