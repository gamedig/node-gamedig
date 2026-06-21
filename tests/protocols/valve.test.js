import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Valve from '../../protocols/valve.js'
import { u8, u16le, i32le, f32le, cstr, char, runWithPackets } from './_helpers.js'

// A2S_INFO response body (everything after the 0x49 type byte, which is what
// valve.sendPacket returns to queryInfo). extraFlag 0xA0 = game port + tags.
const infoPayload = Buffer.concat([
  u8(17), // protocol
  cstr('My TF2 Server'), // name
  cstr('cp_dustbowl'), // map
  cstr('tf'), // folder
  cstr('Team Fortress'), // game
  u16le(440), // appId
  u8(5), // numplayers
  u8(24), // maxplayers
  u8(0), // numbots
  char('d'), // listentype (dedicated)
  char('l'), // environment (linux)
  u8(0), // password
  u8(1), // secure (VAC)
  cstr('1.2.3.4'), // version
  u8(0xA0), // extra data flag: 0x80 (port) | 0x20 (tags)
  u16le(27015), // game port
  cstr('alltalk,increased_maxplayers') // tags
])

// A2S_PLAYER response body (after the 0x44 type byte): count then entries of
// [index byte, name, score int32, time float32].
const playersPayload = Buffer.concat([
  u8(2),
  u8(0), cstr('Alice'), i32le(10), f32le(123.5),
  u8(1), cstr('Bob'), i32le(20), f32le(60)
])

// Answers each query from the fixtures above based on the A2S response type it
// expects (0x49 = info, 0x44 = players).
const runValve = (overrides = {}) =>
  runWithPackets(
    new Valve(),
    { 0x49: infoPayload, 0x44: playersPayload },
    { requestPlayers: true, port: 27015, ...overrides }
  )

describe('valve A2S_INFO parsing', () => {
  it('reads the core server info fields', async () => {
    const state = await runValve()
    assert.equal(state.raw.protocol, 17)
    assert.equal(state.name, 'My TF2 Server')
    assert.equal(state.map, 'cp_dustbowl')
    assert.equal(state.raw.folder, 'tf')
    assert.equal(state.raw.game, 'Team Fortress')
    assert.equal(state.raw.appId, 440)
    assert.equal(state.maxplayers, 24)
    assert.equal(state.raw.numbots, 0)
    assert.equal(state.raw.listentype, 'd')
    assert.equal(state.raw.environment, 'l')
    assert.equal(state.password, false)
    assert.equal(state.raw.secure, 1)
    assert.equal(state.version, '1.2.3.4')
  })

  it('decodes the extra data flag (game port and tags)', async () => {
    const state = await runValve()
    assert.equal(state.gamePort, 27015)
    assert.deepEqual(state.raw.tags, ['alltalk', 'increased_maxplayers'])
  })
})

describe('valve A2S_PLAYER parsing', () => {
  it('parses the raw player list', async () => {
    const state = await runValve()
    assert.deepEqual(state.raw.players, [
      { name: 'Alice', score: 10, time: 123.5 },
      { name: 'Bob', score: 20, time: 60 }
    ])
  })

  it('moves players into the players array during cleanup', async () => {
    const state = await runValve()
    assert.equal(state.players.length, 2)
    assert.deepEqual(Array.from(state.players, (p) => p.name).sort(), ['Alice', 'Bob'])
    assert.equal(state.bots.length, 0)
  })

  it('skips the player query when requestPlayers is false', async () => {
    const state = await runValve({ requestPlayers: false })
    assert.deepEqual(state.raw.players, [])
    assert.equal(state.players.length, 0)
  })
})
