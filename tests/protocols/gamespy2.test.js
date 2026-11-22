import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Gamespy2 from '../../protocols/gamespy2.js'
import { u8, cstr, runWithUdpSequence } from './_helpers.js'

// GameSpy2 replies are prefixed with a 0x00 header byte and the 4-byte ping id
// (1) that the protocol echoes back; sendPacket strips both before parsing.
const reply = (body) => Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x00, 0x01]), body])

// Info query: null-terminated key/value pairs ending with an empty key.
const infoBody = Buffer.concat([
  cstr('hostname'), cstr('My GS2 Server'),
  cstr('mapname'), cstr('de_dust2'),
  cstr('gametype'), cstr('ctf'),
  cstr('numplayers'), cstr('2'),
  cstr('maxplayers'), cstr('16'),
  cstr('password'), cstr('0'),
  cstr('gamever'), cstr('1.2'),
  cstr('') // empty key terminates
])

// Player query: a leading 0 byte, a row count, the '_'-suffixed field names
// (terminated by an empty string), then one value per field per row.
const playersBody = Buffer.concat([
  u8(0), u8(2),
  cstr('player_'), cstr('score_'), cstr('ping_'), cstr(''),
  cstr('Alice'), cstr('10'), cstr('50'),
  cstr('Bob'), cstr('20'), cstr('30')
])

// Team query: same field-data layout, one team row.
const teamsBody = Buffer.concat([
  u8(0), u8(1),
  cstr('team_t'), cstr(''),
  cstr('Red')
])

const runGamespy2 = () =>
  runWithUdpSequence(new Gamespy2(), [reply(infoBody), reply(playersBody), reply(teamsBody)])

describe('gamespy2 info parsing', () => {
  it('maps well-known keys onto the result', async () => {
    const state = await runGamespy2()
    assert.equal(state.name, 'My GS2 Server')
    assert.equal(state.map, 'de_dust2')
    assert.equal(state.password, false)
    assert.equal(state.maxplayers, 16)
    assert.equal(state.version, '1.2')
    assert.equal(state.numplayers, 2)
  })
})

describe('gamespy2 field-data parsing', () => {
  it('parses the player rows, normalising field names and numbers', async () => {
    const state = await runGamespy2()
    assert.equal(state.players.length, 2)
    assert.equal(state.players[0].name, 'Alice')
    assert.equal(state.players[0].raw.score, 10)
    assert.equal(state.players[0].raw.ping, 50)
    assert.equal(state.players[1].name, 'Bob')
    assert.equal(state.players[1].raw.score, 20)
  })

  it('parses the team rows into raw.teams', async () => {
    const state = await runGamespy2()
    assert.deepEqual(state.raw.teams, [{ name: 'Red' }])
  })
})
