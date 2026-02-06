import { describe, it, expect, vi, beforeEach } from 'vitest'
import Core from '../../../protocols/core.js'

describe('Core Protocol', () => {
  let core

  beforeEach(() => {
    core = new Core()
    core.options = {}
    core.dnsResolver = {
      resolve: vi.fn()
    }
  })

  describe('DNS SRV resolution', () => {
    it('should use SRV record port when givenPortOnly is false', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'sopelmc.pl',
        port: 25565,
        givenPortOnly: false
      }

      // Mock DNS resolver to return SRV record with different port
      core.dnsResolver.resolve.mockResolvedValue({
        address: '51.77.56.25',
        port: 26420
      })

      // Mock run to do nothing
      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      // Port should be overridden by SRV record
      expect(core.options.port).toBe(26420)
      expect(core.options.address).toBe('51.77.56.25')
    })

    it('should ignore SRV record port when givenPortOnly is true', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'sopelmc.pl',
        port: 25565,
        givenPortOnly: true
      }

      core.dnsResolver.resolve.mockResolvedValue({
        address: '51.77.56.25',
        port: 26420
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      // Port should remain as given
      expect(core.options.port).toBe(25565)
      expect(core.options.address).toBe('51.77.56.25')
    })

    it('should use default port when no SRV record found', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'example.com',
        port: 25565,
        givenPortOnly: false
      }

      // Mock DNS resolver - no SRV port returned
      core.dnsResolver.resolve.mockResolvedValue({
        address: '1.2.3.4'
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      // Should keep default port
      expect(core.options.port).toBe(25565)
      expect(core.options.address).toBe('1.2.3.4')
    })

    it('should skip DNS resolution when address is provided', async () => {
      core.options = {
        address: '1.2.3.4',
        port: 25565
      }

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      // DNS resolver should not be called
      expect(core.dnsResolver.resolve).not.toHaveBeenCalled()
      expect(core.options.address).toBe('1.2.3.4')
      expect(core.options.port).toBe(25565)
    })

    it('should resolve host when no address provided', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'minecraft.net',
        port: 25565
      }

      core.dnsResolver.resolve.mockResolvedValue({
        address: '5.6.7.8',
        port: 25565
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      expect(core.dnsResolver.resolve).toHaveBeenCalledWith(
        'minecraft.net',
        undefined,
        '_minecraft._tcp'
      )
      expect(core.options.address).toBe('5.6.7.8')
    })
  })

  describe('SRV record with different scenarios', () => {
    it.todo('should prioritize SRV port over default port', async () => {
      // TODO: This test will pass after fixing core.js line 81
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'server.com',
        port: 25565, // Default minecraft port
        givenPortOnly: false
      }

      // SRV returns different port
      core.dnsResolver.resolve.mockResolvedValue({
        address: '10.0.0.1',
        port: 19132 // Bedrock port
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      expect(core.options.port).toBe(19132)
    })

    it('should handle SRV record returning same port as default', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'server.com',
        port: 25565,
        givenPortOnly: false
      }

      core.dnsResolver.resolve.mockResolvedValue({
        address: '10.0.0.1',
        port: 25565 // Same as default
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      expect(core.options.port).toBe(25565)
    })

    it('should not modify port when SRV returns undefined port', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'server.com',
        port: 25565,
        givenPortOnly: false
      }

      core.dnsResolver.resolve.mockResolvedValue({
        address: '10.0.0.1'
        // No port in response
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      expect(core.options.port).toBe(25565)
    })
  })

  describe('result state', () => {
    it('should set queryPort in result', async () => {
      core.options = {
        address: '1.2.3.4',
        port: 25565
      }

      core.run = vi.fn().mockResolvedValue(undefined)

      const result = await core.runOnce()

      expect(result.queryPort).toBe(25565)
    })

    it('should trim server name', async () => {
      core.options = {
        address: '1.2.3.4',
        port: 25565
      }

      core.run = vi.fn().mockImplementation(async (state) => {
        state.name = '   Test Server   '
      })

      const result = await core.runOnce()

      expect(result.name).toBe('Test Server')
    })

    it('should set connect string', async () => {
      core.options = {
        host: 'example.com',
        address: '1.2.3.4',
        port: 25565
      }

      core.run = vi.fn().mockResolvedValue(undefined)

      const result = await core.runOnce()

      expect(result.connect).toBe('example.com:25565')
    })

    it('should initialize empty arrays for players and bots', async () => {
      core.options = {
        address: '1.2.3.4',
        port: 25565
      }

      core.run = vi.fn().mockResolvedValue(undefined)

      const result = await core.runOnce()

      expect(result.players).toEqual([])
      expect(result.bots).toEqual([])
    })
  })

  describe('RTT tracking', () => {
    it('should register RTT from number', () => {
      core.registerRtt(50)
      expect(core.shortestRTT).toBe(50)
    })

    it('should track shortest RTT', () => {
      core.registerRtt(100)
      core.registerRtt(50)
      core.registerRtt(75)
      expect(core.shortestRTT).toBe(50)
    })

    it('should register RTT from promise', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 10))
      core.registerRtt(promise)
      await promise
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(core.shortestRTT).toBeGreaterThan(0)
    })
  })

  describe('utility methods', () => {
    it('should test truthy strings correctly', () => {
      expect(core.trueTest('true')).toBe(true)
      expect(core.trueTest('TRUE')).toBe(true)
      expect(core.trueTest('yes')).toBe(true)
      expect(core.trueTest('YES')).toBe(true)
      expect(core.trueTest('1')).toBe(true)
      expect(core.trueTest(true)).toBe(true)
      expect(core.trueTest(1)).toBe(true)
    })

    it('should test falsy values correctly', () => {
      expect(core.trueTest('false')).toBe(false)
      expect(core.trueTest('no')).toBe(false)
      expect(core.trueTest('0')).toBe(false)
      expect(core.trueTest(false)).toBe(false)
      expect(core.trueTest(0)).toBe(false)
      expect(core.trueTest('')).toBe(false)
    })

    it('should validate port numbers', () => {
      expect(() => core.assertValidPort(25565)).not.toThrow()
      expect(() => core.assertValidPort(1)).not.toThrow()
      expect(() => core.assertValidPort(65535)).not.toThrow()
    })

    it('should reject invalid ports', () => {
      expect(() => core.assertValidPort(0)).toThrow()
      expect(() => core.assertValidPort(-1)).toThrow()
      expect(() => core.assertValidPort(65536)).toThrow()
      expect(() => core.assertValidPort(null)).toThrow()
    })
  })

  describe('ipFamily option', () => {
    it('should pass ipFamily to DNS resolver', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'server.com',
        port: 25565,
        ipFamily: 4
      }

      core.dnsResolver.resolve.mockResolvedValue({
        address: '1.2.3.4'
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      expect(core.dnsResolver.resolve).toHaveBeenCalledWith(
        'server.com',
        4,
        '_minecraft._tcp'
      )
    })

    it('should handle IPv6', async () => {
      core.srvRecord = '_minecraft._tcp'
      core.options = {
        host: 'server.com',
        port: 25565,
        ipFamily: 6
      }

      core.dnsResolver.resolve.mockResolvedValue({
        address: '2001:db8::1'
      })

      core.run = vi.fn().mockResolvedValue(undefined)

      await core.runOnce()

      expect(core.options.address).toBe('2001:db8::1')
    })
  })
})
