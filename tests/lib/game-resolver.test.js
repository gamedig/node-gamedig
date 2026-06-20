import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { lookup } from '../../lib/game-resolver.js'

describe('game-resolver lookup', () => {
  it('throws when no type is provided', () => {
    assert.throws(() => lookup({}), /No game specified/)
  })

  it('resolves a protocol- prefixed type directly to a protocol', () => {
    assert.deepEqual(lookup({ type: 'protocol-valve' }), { protocol: 'valve' })
  })

  it('returns the options for a known game id', () => {
    const options = lookup({ type: 'abioticfactor' })
    assert.equal(options.protocol, 'valve')
    assert.equal(options.port, 27015)
  })

  it('throws for an unknown game id', () => {
    assert.throws(() => lookup({ type: 'definitely-not-a-real-game' }), /Invalid game/)
  })

  it('does not resolve a deprecated id unless checkOldIDs is set', () => {
    // "as" is the old id for "actionsource"
    assert.throws(() => lookup({ type: 'as' }), /Invalid game/)
  })

  it('resolves a deprecated id when checkOldIDs is enabled', () => {
    const options = lookup({ type: 'as', checkOldIDs: true })
    assert.equal(options.protocol, 'valve')
  })
})
