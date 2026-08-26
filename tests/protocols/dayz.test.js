import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Dayz from '../../protocols/dayz.js'
import { u8, u16le, i32le, f32le, cstr, char, runWithPackets } from './_helpers.js'

// A2S_INFO body with DayZ-style server tags, which DayZ decodes in
// processQueryInfo. extraFlag 0x20 = tags only.
const infoPayload = Buffer.concat([
  u8(17), // protocol
  cstr('DayZ Server'), // name
  cstr('chernarusplus'), // map
  cstr('dayz'), // folder
  cstr('DayZ'), // game
  u16le(0), // appId (real DayZ id lives elsewhere; irrelevant here)
  u8(3), // numplayers
  u8(60), // maxplayers
  u8(0), // numbots
  char('d'), // listentype
  char('l'), // environment
  u8(0), // password
  u8(1), // secure
  cstr('1.25'), // version
  u8(0x20), // extra data flag: tags
  cstr('no3rd,isDLC,privHive,external,lqs3,etm12,entm6,13:45')
])

const playersPayload = Buffer.concat([
  u8(1),
  u8(0), cstr('Survivor'), i32le(0), f32le(100)
])

// DayZ A2S_RULES body. DayZ smuggles a mod payload into leading "rule" slots:
// a [nonzero, nonzero, 0] marker, then payload bytes terminated by 0, then
// ordinary key/value rules. In the payload, a logical 0 is escaped as [1, 2].
// Logical mod bytes here are [version=2, overflow=0, dlc1=0, dlc2=0,
// section1Count=0, section2Count=0] -> an empty mod list.
const rulesPayload = Buffer.concat([
  u16le(2), // rule count
  u8(0x10), u8(0x10), u8(0x00), // dayz payload marker
  Buffer.from([2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]), // escaped logical [2,0,0,0,0,0]
  u8(0x00), // payload terminator
  cstr('version'), cstr('1.0') // a normal rule
])

const runDayz = (overrides = {}) =>
  runWithPackets(
    new Dayz(),
    { 0x49: infoPayload, 0x44: playersPayload, 0x45: rulesPayload },
    { port: 27016, ...overrides }
  )

describe('dayz info and tag parsing', () => {
  it('inherits Valve A2S_INFO parsing', async () => {
    const state = await runDayz({ requestPlayers: true })
    assert.equal(state.name, 'DayZ Server')
    assert.equal(state.map, 'chernarusplus')
    assert.equal(state.maxplayers, 60)
    assert.equal(state.version, '1.25')
  })

  it('decodes DayZ-specific information from the server tags', async () => {
    const state = await runDayz({ requestPlayers: true })
    assert.equal(state.raw.firstPerson, true)
    assert.equal(state.raw.dlcEnabled, true)
    assert.equal(state.raw.privateHive, true)
    assert.equal(state.raw.external, true)
    assert.equal(state.raw.official, false)
    assert.equal(state.raw.queue, 3)
    assert.equal(state.raw.dayAcceleration, 12)
    assert.equal(state.raw.nightAcceleration, 6)
    assert.equal(state.raw.time, '13:45')
  })

  it('parses the player list via the inherited Valve query', async () => {
    const state = await runDayz({ requestPlayers: true })
    assert.equal(state.players.length, 1)
    assert.equal(state.players[0].name, 'Survivor')
  })
})

describe('dayz rules and mod payload parsing', () => {
  it('separates the mod payload from ordinary rules', async () => {
    const state = await runDayz({ requestPlayers: false, requestRules: true })
    assert.deepEqual(state.raw.rules, { version: '1.0' })
    assert.deepEqual(state.raw.dayzMods, [])
  })
})
