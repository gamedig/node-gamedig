import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Ase from '../../protocols/ase.js'
import { u8, pstr, runWithUdpResponse } from './_helpers.js'

// A complete, valid ASE ("EYE1") response: server info, one rule, two players.
// ASE strings are length-prefixed with a byte equal to (length + 1), which is
// pstr's default.
const response = Buffer.concat([
  Buffer.from('EYE1', 'utf8'),
  pstr('ase'), // gamename
  pstr('7778'), // gamePort
  pstr('Test Server'), // name
  pstr('CTF'), // gametype
  pstr('de_dust2'), // map
  pstr('1.0'), // version
  pstr('1'), // password
  pstr('2'), // numplayers
  pstr('16'), // maxplayers
  pstr('rule1'), pstr('value1'), // one rule
  pstr(''), // empty key terminates the rules section
  u8(0b1001), pstr('Alice'), pstr('10'), // flags: name + score
  u8(0b1001), pstr('Bob'), pstr('20')
])

describe('ase protocol parsing', () => {
  it('parses server info from an EYE1 response', async () => {
    const state = await runWithUdpResponse(new Ase(), response)
    assert.equal(state.raw.gamename, 'ase')
    assert.equal(state.name, 'Test Server')
    assert.equal(state.raw.gametype, 'CTF')
    assert.equal(state.map, 'de_dust2')
    assert.equal(state.version, '1.0')
    assert.equal(state.password, true)
    assert.equal(state.numplayers, 2)
    assert.equal(state.maxplayers, 16)
  })

  it('parses rules into raw', async () => {
    const state = await runWithUdpResponse(new Ase(), response)
    assert.equal(state.raw.rule1, 'value1')
  })

  it('parses the player list with flag-gated fields', async () => {
    const state = await runWithUdpResponse(new Ase(), response)
    assert.equal(state.players.length, 2)
    assert.equal(state.players[0].name, 'Alice')
    assert.equal(state.players[0].raw.score, 10)
    assert.equal(state.players[1].name, 'Bob')
    assert.equal(state.players[1].raw.score, 20)
  })
})
