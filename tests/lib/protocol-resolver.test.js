import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getProtocol } from '../../lib/ProtocolResolver.js'
import Core from '../../protocols/core.js'

describe('ProtocolResolver.getProtocol', () => {
  it('instantiates a known protocol as a Core subclass', () => {
    const protocol = getProtocol('valve')
    assert.ok(protocol instanceof Core)
    assert.equal(typeof protocol.runOnceSafe, 'function')
  })

  it('returns a fresh instance on each call', () => {
    assert.notEqual(getProtocol('quake3'), getProtocol('quake3'))
  })

  it('throws for an unknown protocol id', () => {
    assert.throws(() => getProtocol('definitely-not-a-protocol'), /Protocol definition file missing/)
  })
})
