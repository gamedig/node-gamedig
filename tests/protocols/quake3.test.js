import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Quake3 from '../../protocols/quake3.js'

const newProtocol = (stripColors) => {
  const protocol = new Quake3()
  protocol.options = { stripColors }
  return protocol
}

describe('quake3.stripColors', () => {
  it('removes single-character Quake 3 colour codes', () => {
    const protocol = newProtocol(true)
    assert.equal(protocol.stripColors('^1Red^7White'), 'RedWhite')
  })

  it('removes extended ^X RRGGBB colour codes', () => {
    const protocol = newProtocol(true)
    assert.equal(protocol.stripColors('^XFF0000Hello'), 'Hello')
  })

  it('leaves the string untouched when stripColors is disabled', () => {
    const protocol = newProtocol(false)
    assert.equal(protocol.stripColors('^1Red^7White'), '^1Red^7White')
  })
})
