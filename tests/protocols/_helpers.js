import { Buffer } from 'node:buffer'

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
