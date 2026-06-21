import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Gamespy1 from '../../protocols/gamespy1.js'
import { Results } from '../../lib/Results.js'

// GameSpy1 responses are backslash-delimited key/value pairs. A queryid with a
// part number plus a trailing \final\ marks the response as complete.
const fields = [
  'hostname', 'My GS1 Server',
  'mapname', 'de_dust2',
  'gametype', 'ctf',
  'numplayers', '2',
  'maxplayers', '16',
  'password', '0',
  'gamever', 'v1.6',
  'playername_0', 'Alice',
  'score_0', '10',
  'playername_1', 'Bob',
  'score_1', '20',
  'queryid', '1.1',
  'final', ''
]
const response = Buffer.from('\\' + fields.join('\\'), 'latin1')

const runWithResponse = async (protocol, buffer) => {
  protocol.options = {}
  protocol.udpSend = async (_payload, onPacket) => onPacket(buffer)
  const state = new Results()
  await protocol.run(state)
  return state
}

describe('gamespy1 protocol parsing', () => {
  it('maps well-known keys onto the result', async () => {
    const state = await runWithResponse(new Gamespy1(), response)
    assert.equal(state.name, 'My GS1 Server')
    assert.equal(state.map, 'de_dust2')
    assert.equal(state.password, false)
    assert.equal(state.maxplayers, 16)
    assert.equal(state.version, 'v1.6')
  })

  it('groups indexed keys into players', async () => {
    const state = await runWithResponse(new Gamespy1(), response)
    assert.equal(state.numplayers, 2)
    assert.equal(state.players.length, 2)
    assert.equal(state.players[0].name, 'Alice')
    assert.equal(state.players[0].raw.score, 10)
    assert.equal(state.players[1].name, 'Bob')
    assert.equal(state.players[1].raw.score, 20)
  })
})
