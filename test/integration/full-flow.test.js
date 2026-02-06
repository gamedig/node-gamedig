/**
 * Integration tests - Full flow with binary replay
 *
 * These tests mock UDP/TCP sockets and replay captured binary responses.
 * This allows testing the entire protocol stack without hitting real servers.
 *
 * Purpose: Ensure code changes don't alter behavior - binary in, result out.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GameDig } from '../../lib/index.js'
import { loadBinaryFixture, mockSocketsWithFixture, setupMocking, restoreMocking } from './test-helpers.js'

beforeEach(() => {
  setupMocking()
})

afterEach(() => {
  restoreMocking()
})

describe('Integration: Full Flow (Binary Replay)', () => {
  describe('Hypixel - without port', () => {
    it('should query and match captured result', async () => {
      const fixture = loadBinaryFixture('hypixel-without-port')
      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'hypixel.net' })

      // Verify against captured result
      expect(result.name).toBe(fixture.result.name)
      expect(result.maxplayers).toBe(fixture.result.maxplayers)
      expect(result.queryPort).toBe(fixture.result.queryPort)
      expect(result.connect).toBe(fixture.result.connect)
      expect(result.password).toBe(false)
      expect(result.map).toBe('')

      // Verify structure
      expect(result.players).toBeInstanceOf(Array)
      expect(result.bots).toBeInstanceOf(Array)
      expect(result.raw).toBeDefined()
    })
  })

  describe('Hypixel - with port', () => {
    it('should query with explicit port and match result', async () => {
      const fixture = loadBinaryFixture('hypixel-with-port')
      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'hypixel.net', port: 25565 })

      expect(result.name).toBe(fixture.result.name)
      expect(result.maxplayers).toBe(fixture.result.maxplayers)
      expect(result.queryPort).toBe(25565)
      expect(result.version).toBe(fixture.result.version)
    })
  })

  describe('sopelmc.pl - with correct port', () => {
    it('should query on port 26420 and succeed', async () => {
      const fixture = loadBinaryFixture('sopelmc-with-port')
      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'sopelmc.pl', port: 26420 })

      expect(result.name).toBe(fixture.result.name)
      expect(result.queryPort).toBe(26420)
      expect(result.maxplayers).toBe(fixture.result.maxplayers)
      expect(result.numplayers).toBe(fixture.result.numplayers)

      // sopelmc has both UDP and TCP packets
      expect(fixture.udp.length).toBeGreaterThan(0)
      expect(fixture.tcp.length).toBeGreaterThan(0)
    })
  })

  describe('sopelmc.pl - without port (wrong port)', () => {
    it('should fail when querying wrong port', async () => {
      const fixture = loadBinaryFixture('sopelmc-without-port')
      mockSocketsWithFixture(fixture)

      // This should fail - no valid responses
      await expect(
        GameDig.query({ type: 'minecraft', host: 'sopelmc.pl' })
      ).rejects.toThrow()

      // Verify error was captured
      expect(fixture.error).toBeDefined()
      expect(fixture.error.error).toContain('Failed')

      // Verify requests were sent but got no responses
      expect(fixture.meta.udpTimeouts).toBeGreaterThan(0)
      expect(fixture.udp.length).toBe(0) // no successful responses
    })
  })

  describe('Binary replay validation', () => {
    it('should replay exact binary data through protocol stack', async () => {
      const fixture = loadBinaryFixture('hypixel-without-port')

      // Verify we have binary data
      expect(fixture.tcp.length).toBeGreaterThan(0)
      expect(fixture.tcp[0].request).toBeInstanceOf(Buffer)
      expect(fixture.tcp[0].response).toBeInstanceOf(Buffer)

      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'hypixel.net' })

      // The entire protocol stack processed the binary and produced correct result
      expect(result.name).toBeTruthy()
      expect(result.maxplayers).toBeGreaterThan(0)
      expect(result.ping).toBeGreaterThanOrEqual(0)
    })

    it('should handle multiple protocol attempts (UDP timeouts, TCP success)', async () => {
      const fixture = loadBinaryFixture('hypixel-without-port')

      // Hypixel tries UDP first (gamespy, bedrock) which timeout
      // Then succeeds with TCP (vanilla)
      expect(fixture.meta.udpTimeouts).toBe(2)
      expect(fixture.meta.tcpPackets).toBeGreaterThan(0)

      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'hypixel.net' })
      expect(result.name).toBeTruthy()
    })
  })

  describe('Regression protection', () => {
    it('should maintain stable output for same binary input', async () => {
      const fixture = loadBinaryFixture('sopelmc-with-port')
      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'sopelmc.pl', port: 26420 })

      // Critical fields that must not change
      const criticalFields = {
        name: fixture.result.name,
        maxplayers: fixture.result.maxplayers,
        numplayers: fixture.result.numplayers,
        queryPort: fixture.result.queryPort,
        password: fixture.result.password,
        map: fixture.result.map
      }

      Object.entries(criticalFields).forEach(([field, expected]) => {
        expect(result[field]).toBe(expected)
      })
    })

    it('should parse complex server with both UDP and TCP protocols', async () => {
      const fixture = loadBinaryFixture('sopelmc-with-port')

      // sopelmc uses multiple protocols
      expect(fixture.udp.length).toBeGreaterThan(0)
      expect(fixture.tcp.length).toBeGreaterThan(0)

      mockSocketsWithFixture(fixture)

      const result = await GameDig.query({ type: 'minecraft', host: 'sopelmc.pl', port: 26420 })

      // Verify protocol data was merged correctly
      expect(result.raw).toBeDefined()
      expect(result.raw.vanilla).toBeDefined()
      expect(result.players).toBeInstanceOf(Array)
    })
  })
})
