import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Core from '../../protocols/core.js'

const core = new Core()

describe('Core.trueTest', () => {
  it('passes booleans through unchanged', () => {
    assert.equal(core.trueTest(true), true)
    assert.equal(core.trueTest(false), false)
  })

  it('treats any non-zero number as true', () => {
    assert.equal(core.trueTest(1), true)
    assert.equal(core.trueTest(-5), true)
    assert.equal(core.trueTest(0), false)
  })

  it('recognises truthy strings case-insensitively', () => {
    assert.equal(core.trueTest('true'), true)
    assert.equal(core.trueTest('TRUE'), true)
    assert.equal(core.trueTest('yes'), true)
    assert.equal(core.trueTest('1'), true)
  })

  it('treats other strings and types as false', () => {
    assert.equal(core.trueTest('false'), false)
    assert.equal(core.trueTest('0'), false)
    assert.equal(core.trueTest('nope'), false)
    assert.equal(core.trueTest(undefined), false)
    assert.equal(core.trueTest(null), false)
  })
})

describe('Core.translate', () => {
  it('renames keys according to the translation map', () => {
    const obj = { hostname: 'My Server', mapname: 'de_dust2' }
    core.translate(obj, { hostname: 'name', mapname: 'map' })
    assert.deepEqual(obj, { name: 'My Server', map: 'de_dust2' })
  })

  it('deletes a key when the target is falsy', () => {
    const obj = { secret: 'x', keep: 1 }
    core.translate(obj, { secret: null })
    assert.deepEqual(obj, { keep: 1 })
  })

  it('ignores keys that are not present', () => {
    const obj = { a: 1 }
    core.translate(obj, { missing: 'b' })
    assert.deepEqual(obj, { a: 1 })
  })
})

describe('Core.assertValidPort', () => {
  it('accepts ports within the valid range', () => {
    assert.doesNotThrow(() => core.assertValidPort(1))
    assert.doesNotThrow(() => core.assertValidPort(27015))
    assert.doesNotThrow(() => core.assertValidPort(65535))
  })

  it('throws when no port is provided', () => {
    assert.throws(() => core.assertValidPort(undefined), /provide a port/)
    assert.throws(() => core.assertValidPort(0), /provide a port/)
  })

  it('throws for out-of-range ports', () => {
    assert.throws(() => core.assertValidPort(65536), /Invalid tcp\/ip port/)
    assert.throws(() => core.assertValidPort(-1), /Invalid tcp\/ip port/)
  })
})
