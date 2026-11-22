import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Quake2 from '../../protocols/quake2.js'
import { runWithUdpResponse } from './_helpers.js'

// A Quake2 status response: the 0xFFFFFFFF prefix, the "print" header, a
// backslash-delimited serverinfo line, then one player line per row. Players
// with a ping of 0 are treated as bots.
const serverinfo = '\\mapname\\q2dm1\\sv_hostname\\My Q2 Server\\maxclients\\16\\version\\r1q2'
const players = [
  '10 50 "Alice" "1.2.3.4:27901"',
  '20 0 "Bob" "5.6.7.8:27901"'
].join('\n')
const response = Buffer.concat([
  Buffer.from([0xff, 0xff, 0xff, 0xff]),
  Buffer.from('print\n' + serverinfo + '\n' + players, 'latin1')
])

describe('quake2 protocol parsing', () => {
  it('parses serverinfo key/values', async () => {
    const state = await runWithUdpResponse(new Quake2(), response)
    assert.equal(state.name, 'My Q2 Server')
    assert.equal(state.map, 'q2dm1')
    assert.equal(state.version, 'r1q2')
    assert.equal(state.raw.mapname, 'q2dm1')
    // quake2 leaves maxplayers as the raw serverinfo string
    assert.equal(state.maxplayers, '16')
  })

  it('splits players and bots by ping', async () => {
    const state = await runWithUdpResponse(new Quake2(), response)
    assert.equal(state.numplayers, 2)

    assert.equal(state.players.length, 1)
    assert.equal(state.players[0].name, 'Alice')
    assert.equal(state.players[0].raw.frags, 10)
    assert.equal(state.players[0].raw.ping, 50)
    assert.equal(state.players[0].raw.address, '1.2.3.4:27901')

    assert.equal(state.bots.length, 1)
    assert.equal(state.bots[0].name, 'Bob')
    assert.equal(state.bots[0].raw.ping, 0)
  })
})
