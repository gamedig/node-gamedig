import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import DnsResolver from '../../lib/DnsResolver.js'

// A logger stub so we never touch the real console during tests.
const silentLogger = { debug () {} }
const newResolver = () => new DnsResolver(silentLogger)

// These cover the paths that resolve without ever hitting the network: a raw
// IP address short-circuits the lookup, and an un-encodable host throws before
// any DNS request is made.
describe('DnsResolver.resolve (offline paths)', () => {
  it('returns an IPv4 address unchanged without a lookup', async () => {
    const result = await newResolver().resolve('127.0.0.1', 0)
    assert.deepEqual(result, { address: '127.0.0.1' })
  })

  it('returns an IPv6 address unchanged without a lookup', async () => {
    const result = await newResolver().resolve('::1', 0)
    assert.deepEqual(result, { address: '::1' })
  })

  it('throws for a host that cannot be encoded to ASCII', async () => {
    await assert.rejects(newResolver().resolve('', 0), /Invalid domain/)
  })
})
