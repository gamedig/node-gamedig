import { describe, it, expect } from 'vitest'
import { lookup } from '../../../lib/game-resolver.js'

describe('game-resolver', () => {
  describe('lookup()', () => {
    describe('protocol lookup', () => {
      it('should return protocol object when type starts with "protocol-"', () => {
        const result = lookup({ type: 'protocol-valve' })

        expect(result).toEqual({ protocol: 'valve' })
      })

      it('should extract correct protocol name from "protocol-" prefix', () => {
        const result = lookup({ type: 'protocol-minecraft' })

        expect(result).toEqual({ protocol: 'minecraft' })
      })
    })

    describe('game ID lookup', () => {
      it('should return game options for valid game ID', () => {
        const result = lookup({ type: 'abioticfactor' })

        expect(result).toEqual({
          port: 27015,
          protocol: 'valve'
        })
      })

      it('should return game options with port_query when defined', () => {
        const result = lookup({ type: 'aoe2' })

        expect(result).toEqual({
          port_query: 27224,
          protocol: 'ase'
        })
      })

      it('should return game options with port_query_offset when defined', () => {
        const result = lookup({ type: 'atlas' })

        expect(result).toEqual({
          port: 5761,
          port_query_offset: 51800,
          protocol: 'valve'
        })
      })
    })

    describe('old ID lookup', () => {
      it('should find game by old_id when checkOldIDs is true', () => {
        const result = lookup({ type: 'as', checkOldIDs: true })

        expect(result).toEqual({
          port: 27015,
          protocol: 'valve'
        })
      })

      it('should find game by old_id "ageofchivalry" when checkOldIDs is true', () => {
        const result = lookup({ type: 'ageofchivalry', checkOldIDs: true })

        expect(result).toEqual({
          port: 27015,
          protocol: 'valve'
        })
      })

      it('should NOT find game by old_id when checkOldIDs is false', () => {
        expect(() => {
          lookup({ type: 'as', checkOldIDs: false })
        }).toThrow('Invalid game: as')
      })

      it('should NOT find game by old_id when checkOldIDs is undefined', () => {
        expect(() => {
          lookup({ type: 'arkse' })
        }).toThrow('Invalid game: arkse')
      })
    })

    describe('error handling', () => {
      it('should throw error when type is not provided', () => {
        expect(() => {
          lookup({})
        }).toThrow('No game specified')
      })

      it('should throw error when type is null', () => {
        expect(() => {
          lookup({ type: null })
        }).toThrow('No game specified')
      })

      it('should throw error when type is undefined', () => {
        expect(() => {
          lookup({ type: undefined })
        }).toThrow('No game specified')
      })

      it('should throw error for invalid game ID', () => {
        expect(() => {
          lookup({ type: 'nonexistentgame' })
        }).toThrow('Invalid game: nonexistentgame')
      })

      it('should throw error with correct game name in message', () => {
        expect(() => {
          lookup({ type: 'fakegame123' })
        }).toThrow('Invalid game: fakegame123')
      })
    })

    describe('return value structure', () => {
      it('should return only game.options, not entire game object', () => {
        const result = lookup({ type: 'abioticfactor' })

        expect(result).not.toHaveProperty('name')
        expect(result).not.toHaveProperty('release_year')
        expect(result).toHaveProperty('protocol')
        expect(result).toHaveProperty('port')
      })

      it('should not include extra field in returned options', () => {
        const result = lookup({ type: 'actionsource' })

        expect(result).not.toHaveProperty('extra')
        expect(result).not.toHaveProperty('old_id')
      })
    })
  })
})
