import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Player, Players, Results } from '../../lib/Results.js'

describe('Player', () => {
  it('accepts a bare string as the name', () => {
    const player = new Player('Dav1d')
    assert.equal(player.name, 'Dav1d')
    assert.deepEqual(player.raw, {})
  })

  it('splits an object into name and raw fields', () => {
    const player = new Player({ name: 'Dav1d', score: 42, ping: 30 })
    assert.equal(player.name, 'Dav1d')
    assert.deepEqual(player.raw, { score: 42, ping: 30 })
  })

  it('defaults to an empty name when none is provided', () => {
    const player = new Player({ score: 7 })
    assert.equal(player.name, '')
    assert.deepEqual(player.raw, { score: 7 })
  })
})

describe('Players', () => {
  it('wraps pushed entries in Player instances', () => {
    const players = new Players()
    players.push('Alice')
    players.push({ name: 'Bob', score: 10 })

    assert.equal(players.length, 2)
    assert.ok(players[0] instanceof Player)
    assert.equal(players[0].name, 'Alice')
    assert.equal(players[1].name, 'Bob')
    assert.deepEqual(players[1].raw, { score: 10 })
  })

  it('is an Array subclass', () => {
    assert.ok(new Players() instanceof Array)
  })
})

describe('Results', () => {
  it('exposes sensible defaults', () => {
    const results = new Results()
    assert.equal(results.name, '')
    assert.equal(results.map, '')
    assert.equal(results.password, false)
    assert.equal(results.maxplayers, 0)
    assert.equal(results.numplayers, 0)
    assert.equal(results.queryPort, 0)
    assert.ok(results.players instanceof Players)
    assert.ok(results.bots instanceof Players)
    assert.deepEqual(results.raw, {})
  })

  it('gives each instance its own players/bots arrays', () => {
    const a = new Results()
    const b = new Results()
    a.players.push('Solo')
    assert.equal(a.players.length, 1)
    assert.equal(b.players.length, 0)
  })
})
