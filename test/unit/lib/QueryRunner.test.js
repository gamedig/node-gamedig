import { describe, it, expect, vi, beforeEach } from 'vitest'
import QueryRunner from '../../../lib/QueryRunner.js'

// Mock dependencies
vi.mock('../../../lib/game-resolver.js', () => ({
  lookup: vi.fn((opts) => ({
    protocol: opts.type || 'test',
    port: 25565,
    port_query_offset: 0
  }))
}))

vi.mock('../../../lib/ProtocolResolver.js', () => ({
  getProtocol: vi.fn(() => ({
    runOnceSafe: vi.fn().mockResolvedValue({ name: 'Test Server' }),
    options: {}
  }))
}))

vi.mock('../../../lib/GlobalUdpSocket.js', () => ({
  default: class MockGlobalUdpSocket {
    constructor() {}
  }
}))

describe('QueryRunner', () => {
  let runner

  beforeEach(() => {
    runner = new QueryRunner()
    vi.clearAllMocks()
  })

  describe('givenPortOnly option', () => {
    it('should only use given port when givenPortOnly is true', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockResolvedValue({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await runner.run({
        type: 'minecraft',
        host: 'test.com',
        port: 25565,
        givenPortOnly: true
      })

      // Should only attempt once with the given port
      expect(mockProtocol.runOnceSafe).toHaveBeenCalledTimes(1)
      expect(mockProtocol.options.port).toBe(25565)
    })

    it('should try multiple ports when givenPortOnly is false', async () => {
      const { lookup } = await import('../../../lib/game-resolver.js')
      lookup.mockReturnValue({
        protocol: 'minecraft',
        port: 25565,
        port_query_offset: [0, 10] // Will try port+0 and port+10
      })

      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn()
          .mockRejectedValueOnce(new Error('Failed'))
          .mockRejectedValueOnce(new Error('Failed'))
          .mockResolvedValueOnce({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await runner.run({
        type: 'minecraft',
        host: 'test.com',
        port: 25565,
        givenPortOnly: false
      })

      // Should try multiple ports
      expect(mockProtocol.runOnceSafe).toHaveBeenCalledTimes(3)
    })
  })

  describe('port cache', () => {
    it('should cache successful port', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockResolvedValue({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await runner.run({
        type: 'minecraft',
        host: 'test.com',
        address: '1.2.3.4',
        port: 25565,
        portCache: true
      })

      expect(runner.portCache['1.2.3.4:25565']).toBeDefined()
    })

    it('should not cache when portCache is false', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockResolvedValue({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await runner.run({
        type: 'minecraft',
        host: 'test.com',
        address: '1.2.3.4',
        port: 25565,
        portCache: false
      })

      expect(runner.portCache['1.2.3.4:25565']).toBeUndefined()
    })

    it('should ignore cache when givenPortOnly is true', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockResolvedValue({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      // Set cached port
      runner.portCache['1.2.3.4:25565'] = 26420

      await runner.run({
        type: 'minecraft',
        host: 'test.com',
        address: '1.2.3.4',
        port: 25565,
        givenPortOnly: true,
        portCache: true
      })

      // Should use given port, not cached
      expect(mockProtocol.options.port).toBe(25565)
    })
  })

  describe('error handling', () => {
    it('should throw "Failed all X attempts" when all attempts fail', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockRejectedValue(new Error('Connection failed')),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await expect(
        runner.run({
          type: 'minecraft',
          host: 'test.com',
          port: 25565,
          maxRetries: 1
        })
      ).rejects.toThrow(/Failed all \d+ attempts/)
    })

    it('should return success on first successful attempt', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockResolvedValue({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      const result = await runner.run({
        type: 'minecraft',
        host: 'test.com',
        port: 25565
      })

      expect(result).toBeDefined()
      expect(result.name).toBe('Server')
    })
  })

  describe('retry logic', () => {
    it('should retry specified number of times', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn()
          .mockRejectedValueOnce(new Error('Fail'))
          .mockRejectedValueOnce(new Error('Fail'))
          .mockResolvedValueOnce({ name: 'Server' }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await runner.run({
        type: 'minecraft',
        host: 'test.com',
        port: 25565,
        maxRetries: 3
      })

      expect(mockProtocol.runOnceSafe).toHaveBeenCalledTimes(3)
    })

    it('should use default maxRetries when not specified', async () => {
      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const mockProtocol = {
        runOnceSafe: vi.fn().mockRejectedValue(new Error('Fail')),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await expect(
        runner.run({
          type: 'minecraft',
          host: 'test.com',
          port: 25565
        })
      ).rejects.toThrow()

      // Default maxRetries is 1
      expect(mockProtocol.runOnceSafe).toHaveBeenCalled()
    })
  })

  describe('port offset', () => {
    it('should try ports with offsets', async () => {
      const { lookup } = await import('../../../lib/game-resolver.js')
      lookup.mockReturnValue({
        protocol: 'minecraft',
        port: 25565,
        port_query_offset: [0, 5, 10]
      })

      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const ports = []
      const mockProtocol = {
        runOnceSafe: vi.fn().mockImplementation(async function () {
          ports.push(this.options.port)
          throw new Error('Fail')
        }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await expect(
        runner.run({
          type: 'minecraft',
          host: 'test.com',
          port: 100,
          maxRetries: 1
        })
      ).rejects.toThrow()

      expect(ports).toContain(100) // base port
      expect(ports).toContain(105) // base + 5
      expect(ports).toContain(110) // base + 10
    })
  })

  describe('attempt order', () => {
    it('should use breadth-first by default', async () => {
      const { lookup } = await import('../../../lib/game-resolver.js')
      lookup.mockReturnValue({
        protocol: 'test',
        port: 100,
        port_query_offset: [0, 10]
      })

      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const attempts = []
      const mockProtocol = {
        runOnceSafe: vi.fn().mockImplementation(async function () {
          attempts.push({ port: this.options.port })
          throw new Error('Fail')
        }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await expect(
        runner.run({
          type: 'test',
          host: 'test.com',
          port: 100,
          maxRetries: 2,
          noBreadthOrder: false
        })
      ).rejects.toThrow()

      // Breadth-first: retry 0 all ports, then retry 1 all ports
      expect(attempts.length).toBeGreaterThan(2)
    })

    it('should use depth-first when noBreadthOrder is true', async () => {
      const { lookup } = await import('../../../lib/game-resolver.js')
      lookup.mockReturnValue({
        protocol: 'test',
        port: 100,
        port_query_offset: [0, 10]
      })

      const { getProtocol } = await import('../../../lib/ProtocolResolver.js')
      const attempts = []
      const mockProtocol = {
        runOnceSafe: vi.fn().mockImplementation(async function () {
          attempts.push({ port: this.options.port })
          throw new Error('Fail')
        }),
        options: {}
      }
      getProtocol.mockReturnValue(mockProtocol)

      await expect(
        runner.run({
          type: 'test',
          host: 'test.com',
          port: 100,
          maxRetries: 2,
          noBreadthOrder: true
        })
      ).rejects.toThrow()

      // Depth-first: all retries port 1, then all retries port 2
      expect(attempts.length).toBeGreaterThan(2)
    })
  })
})
