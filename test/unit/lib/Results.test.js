import { describe, it, expect } from 'vitest'
import { Player, Players, Results } from '../../../lib/Results.js'

describe('Results.js', () => {
  describe('Player', () => {
    describe('constructor', () => {
      it('should create player from empty object', () => {
        const player = new Player({})

        expect(player.name).toBe('')
        expect(player.raw).toEqual({})
      })

      it('should create player from string name', () => {
        const player = new Player('JohnDoe')

        expect(player.name).toBe('JohnDoe')
        expect(player.raw).toEqual({})
      })

      it('should create player from object with name', () => {
        const player = new Player({ name: 'JaneDoe' })

        expect(player.name).toBe('JaneDoe')
        expect(player.raw).toEqual({})
      })

      it('should create player from object with name and raw data', () => {
        const player = new Player({
          name: 'Player1',
          score: 100,
          ping: 50
        })

        expect(player.name).toBe('Player1')
        expect(player.raw).toEqual({
          score: 100,
          ping: 50
        })
      })

      it('should keep raw data when name is not provided', () => {
        const player = new Player({
          score: 100,
          ping: 50
        })

        expect(player.name).toBe('')
        expect(player.raw).toEqual({
          score: 100,
          ping: 50
        })
      })

      it('should handle empty string as name', () => {
        const player = new Player('')

        expect(player.name).toBe('')
        expect(player.raw).toEqual({})
      })
    })

    describe('properties', () => {
      it('should allow setting name after construction', () => {
        const player = new Player({})
        player.name = 'UpdatedName'

        expect(player.name).toBe('UpdatedName')
      })

      it('should allow adding raw properties after construction', () => {
        const player = new Player('Test')
        player.raw.customField = 'value'

        expect(player.raw.customField).toBe('value')
      })
    })
  })

  describe('Players', () => {
    describe('inheritance', () => {
      it('should extend Array', () => {
        const players = new Players()

        expect(players).toBeInstanceOf(Array)
        expect(players).toBeInstanceOf(Players)
      })

      it('should start with zero length', () => {
        const players = new Players()

        expect(players.length).toBe(0)
      })
    })

    describe('push()', () => {
      it('should create Player instance from string when pushed', () => {
        const players = new Players()
        players.push('PlayerName')

        expect(players.length).toBe(1)
        expect(players[0]).toBeInstanceOf(Player)
        expect(players[0].name).toBe('PlayerName')
      })

      it('should create Player instance from object when pushed', () => {
        const players = new Players()
        players.push({ name: 'Test', score: 100 })

        expect(players.length).toBe(1)
        expect(players[0]).toBeInstanceOf(Player)
        expect(players[0].name).toBe('Test')
        expect(players[0].raw.score).toBe(100)
      })

      it('should handle multiple pushes', () => {
        const players = new Players()
        players.push('Player1')
        players.push('Player2')
        players.push({ name: 'Player3', kills: 5 })

        expect(players.length).toBe(3)
        expect(players[0].name).toBe('Player1')
        expect(players[1].name).toBe('Player2')
        expect(players[2].name).toBe('Player3')
        expect(players[2].raw.kills).toBe(5)
      })
    })

    describe('array operations', () => {
      it('should support iteration', () => {
        const players = new Players()
        players.push('Player1')
        players.push('Player2')

        const names = []
        for (const player of players) {
          names.push(player.name)
        }

        expect(names).toEqual(['Player1', 'Player2'])
      })

      it('should support map()', () => {
        const players = new Players()
        players.push('Alice')
        players.push('Bob')

        const names = players.map(p => p.name)

        expect(names).toEqual(['Alice', 'Bob'])
      })

      it('should support filter()', () => {
        const players = new Players()
        players.push({ name: 'Alice', score: 100 })
        players.push({ name: 'Bob', score: 50 })

        const highScorers = players.filter(p => p.raw.score > 75)

        expect(highScorers.length).toBe(1)
        expect(highScorers[0].name).toBe('Alice')
      })
    })
  })

  describe('Results', () => {
    describe('constructor', () => {
      it('should create Results with default values', () => {
        const results = new Results()

        expect(results.name).toBe('')
        expect(results.map).toBe('')
        expect(results.password).toBe(false)
        expect(results.raw).toEqual({})
        expect(results.version).toBe('')
        expect(results.maxplayers).toBe(0)
        expect(results.numplayers).toBe(0)
        expect(results.queryPort).toBe(0)
      })

      it('should have players as Players instance', () => {
        const results = new Results()

        expect(results.players).toBeInstanceOf(Players)
        expect(results.players.length).toBe(0)
      })

      it('should have bots as Players instance', () => {
        const results = new Results()

        expect(results.bots).toBeInstanceOf(Players)
        expect(results.bots.length).toBe(0)
      })
    })

    describe('properties', () => {
      it('should allow setting string properties', () => {
        const results = new Results()
        results.name = 'Test Server'
        results.map = 'de_dust2'
        results.version = '1.0.0'

        expect(results.name).toBe('Test Server')
        expect(results.map).toBe('de_dust2')
        expect(results.version).toBe('1.0.0')
      })

      it('should allow setting boolean properties', () => {
        const results = new Results()
        results.password = true

        expect(results.password).toBe(true)
      })

      it('should allow setting numeric properties', () => {
        const results = new Results()
        results.maxplayers = 32
        results.numplayers = 15
        results.queryPort = 27015

        expect(results.maxplayers).toBe(32)
        expect(results.numplayers).toBe(15)
        expect(results.queryPort).toBe(27015)
      })

      it('should allow adding raw data', () => {
        const results = new Results()
        results.raw.customField = 'value'
        results.raw.serverId = 12345

        expect(results.raw.customField).toBe('value')
        expect(results.raw.serverId).toBe(12345)
      })
    })

    describe('players and bots', () => {
      it('should allow pushing players', () => {
        const results = new Results()
        results.players.push('Player1')
        results.players.push({ name: 'Player2', score: 100 })

        expect(results.players.length).toBe(2)
        expect(results.players[0].name).toBe('Player1')
        expect(results.players[1].name).toBe('Player2')
      })

      it('should allow pushing bots', () => {
        const results = new Results()
        results.bots.push('Bot1')
        results.bots.push({ name: 'Bot2', difficulty: 'hard' })

        expect(results.bots.length).toBe(2)
        expect(results.bots[0].name).toBe('Bot1')
        expect(results.bots[1].name).toBe('Bot2')
      })

      it('should keep players and bots separate', () => {
        const results = new Results()
        results.players.push('Player1')
        results.bots.push('Bot1')

        expect(results.players.length).toBe(1)
        expect(results.bots.length).toBe(1)
        expect(results.players[0].name).toBe('Player1')
        expect(results.bots[0].name).toBe('Bot1')
      })
    })

    describe('complete example', () => {
      it('should represent a typical game server query result', () => {
        const results = new Results()
        results.name = 'Awesome Gaming Server'
        results.map = 'ctf_2fort'
        results.password = false
        results.maxplayers = 24
        results.numplayers = 12
        results.version = '1.2.3'
        results.queryPort = 27015

        results.players.push({ name: 'Alice', score: 150, ping: 30 })
        results.players.push({ name: 'Bob', score: 120, ping: 45 })
        results.bots.push({ name: '[BOT]Charlie', difficulty: 'medium' })

        results.raw.gameMode = 'capture-the-flag'
        results.raw.serverRegion = 'EU'

        expect(results.name).toBe('Awesome Gaming Server')
        expect(results.players.length).toBe(2)
        expect(results.bots.length).toBe(1)
        expect(results.players[0].raw.score).toBe(150)
        expect(results.raw.gameMode).toBe('capture-the-flag')
      })
    })
  })
})
