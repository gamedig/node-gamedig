import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Ase from '../../protocols/ase.js'
import { Results } from '../../lib/Results.js'

// ASE strings are length-prefixed with a single byte equal to (length + 1).
const pstr = (s) => {
  const body = Buffer.from(s, 'utf8')
  return Buffer.concat([Buffer.from([body.length + 1]), body])
}
const byte = (n) => Buffer.from([n])

// A complete, valid ASE ("EYE1") response: server info, one rule, two players.
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
  byte(0b1001), pstr('Alice'), pstr('10'), // flags: name + score
  byte(0b1001), pstr('Bob'), pstr('20')
])

// Drives a protocol's run() against a fixed response buffer by replacing the
// single network method (udpSend) with one that invokes the real onPacket
// parser. Nothing here opens a socket.
const runWithResponse = async (protocol, buffer) => {
  protocol.options = {}
  protocol.udpSend = async (_payload, onPacket) => onPacket(buffer)
  const state = new Results()
  await protocol.run(state)
  return state
}

describe('ase protocol parsing', () => {
  it('parses server info from an EYE1 response', async () => {
    const state = await runWithResponse(new Ase(), response)
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
    const state = await runWithResponse(new Ase(), response)
    assert.equal(state.raw.rule1, 'value1')
  })

  it('parses the player list with flag-gated fields', async () => {
    const state = await runWithResponse(new Ase(), response)
    assert.equal(state.players.length, 2)
    assert.equal(state.players[0].name, 'Alice')
    assert.equal(state.players[0].raw.score, 10)
    assert.equal(state.players[1].name, 'Bob')
    assert.equal(state.players[1].raw.score, 20)
  })
})
