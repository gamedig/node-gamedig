import { describe, it, expect, vi, beforeEach } from 'vitest'
import MinecraftBedrock from '../../../protocols/minecraftbedrock.js'
import { Results } from '../../../lib/Results.js'

describe('protocols/minecraftbedrock', () => {
  let protocol
  let mockUdpSocket

  beforeEach(() => {
    protocol = new MinecraftBedrock()
    protocol.options = { host: '127.0.0.1', port: 19132 }
    mockUdpSocket = { send: vi.fn() }
    protocol.udpSocket = mockUdpSocket
    protocol.logger = { debug: vi.fn() }
  })

  // Helper to create valid bedrock response
  const createBedrockResponse = (statusString) => {
    const statusBuffer = Buffer.from(statusString, 'utf8')
    const statusLength = statusBuffer.length

    return Buffer.concat([
      Buffer.from([0x1c]), // Message ID (PONG)
      Buffer.from('1122334455667788', 'hex'), // Matching nonce
      Buffer.from('0000000000000000', 'hex'), // Server ID
      Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'), // Magic
      Buffer.from([
        (statusLength >> 8) & 0xff,
        statusLength & 0xff
      ]), // Status length as uint16 BE
      statusBuffer
    ])
  }

  describe('constructor', () => {
    it('should set byte order to big-endian', () => {
      expect(protocol.byteorder).toBe('be')
    })
  })

  describe('run() - successful query', () => {
    it('should parse valid bedrock server response', async () => {
      const statusString = 'MCPE;Test Server;527;1.19.50;2;20;12345;World Name;Survival;1;19132;19133'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.edition).toBe('MCPE')
      expect(state.name).toBe('Test Server')
      expect(state.raw.protocolVersion).toBe('527')
      expect(state.raw.mcVersion).toBe('1.19.50')
      expect(state.version).toBe('1.19.50')
      expect(state.numplayers).toBe(2)
      expect(state.maxplayers).toBe(20)
      expect(state.raw.serverId).toBe('12345')
      expect(state.map).toBe('World Name')
      expect(state.raw.gameMode).toBe('Survival')
      expect(state.raw.nintendoOnly).toBe(true)
      expect(state.raw.ipv4Port).toBe('19132')
      expect(state.raw.ipv6Port).toBe('19133')
    })

    it('should parse minimal bedrock response with only required fields', async () => {
      const statusString = 'MCPE;Server;400;1.18;5;10'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.edition).toBe('MCPE')
      expect(state.name).toBe('Server')
      expect(state.numplayers).toBe(5)
      expect(state.maxplayers).toBe(10)
      // map has default value '' from Results class
      expect(state.map).toBe('')
      expect(state.raw.gameMode).toBeUndefined()
    })

    it('should handle server with 0 players', async () => {
      const statusString = 'MCPE;Empty Server;527;1.19;0;50'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Empty Server')
      expect(state.numplayers).toBe(0)
      expect(state.maxplayers).toBe(50)
    })

    it('should handle Nintendo-only flag as false', async () => {
      const statusString = 'MCPE;Server;527;1.19;5;10;999;Map;Creative;0'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.nintendoOnly).toBe(false)
    })
  })

  describe('run() - request validation', () => {
    it('should send correct ping packet structure', async () => {
      const expectedPacket = Buffer.concat([
        Buffer.from([0x01]), // Message ID
        Buffer.from('1122334455667788', 'hex'), // Nonce
        Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'), // Magic
        Buffer.from('0000000000000000', 'hex') // Client GUID
      ])

      protocol.udpSend = vi.fn().mockResolvedValue(undefined)

      const state = new Results()
      await protocol.run(state)

      expect(protocol.udpSend).toHaveBeenCalledWith(
        expectedPacket,
        expect.any(Function)
      )
    })
  })

  describe('run() - error handling', () => {
    it('should reject packet with invalid message ID', async () => {
      const response = Buffer.concat([
        Buffer.from([0xFF]), // Wrong message ID
        Buffer.from('1122334455667788', 'hex'),
        Buffer.from('0000000000000000', 'hex'),
        Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'),
        Buffer.from([0x00, 0x10]),
        Buffer.from('MCPE;Test;1;1;0;10')
      ])

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        const result = callback(response)
        if (result === undefined) {
          return Promise.reject(new Error('Timeout'))
        }
        return Promise.resolve(result)
      })

      const state = new Results()

      await expect(protocol.run(state)).rejects.toThrow()
      expect(protocol.logger.debug).toHaveBeenCalledWith(expect.stringContaining('invalid message id'))
    })

    it('should reject packet with invalid nonce', async () => {
      const response = Buffer.concat([
        Buffer.from([0x1c]),
        Buffer.from('9999999999999999', 'hex'), // Wrong nonce
        Buffer.from('0000000000000000', 'hex'),
        Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'),
        Buffer.from([0x00, 0x10]),
        Buffer.from('MCPE;Test;1;1;0;10')
      ])

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        const result = callback(response)
        if (result === undefined) {
          return Promise.reject(new Error('Timeout'))
        }
        return Promise.resolve(result)
      })

      const state = new Results()

      await expect(protocol.run(state)).rejects.toThrow()
      expect(protocol.logger.debug).toHaveBeenCalledWith(expect.stringContaining('invalid nonce'))
    })

    it('should reject packet with invalid magic value', async () => {
      const response = Buffer.concat([
        Buffer.from([0x1c]),
        Buffer.from('1122334455667788', 'hex'),
        Buffer.from('0000000000000000', 'hex'),
        Buffer.from('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex'), // Wrong magic
        Buffer.from([0x00, 0x10]),
        Buffer.from('MCPE;Test;1;1;0;10')
      ])

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        const result = callback(response)
        if (result === undefined) {
          return Promise.reject(new Error('Timeout'))
        }
        return Promise.resolve(result)
      })

      const state = new Results()

      await expect(protocol.run(state)).rejects.toThrow()
      expect(protocol.logger.debug).toHaveBeenCalledWith(expect.stringContaining('invalid magic'))
    })

    it('should throw error when status length mismatch', async () => {
      const statusString = 'MCPE;Test;1;1;0;10'
      const statusBuffer = Buffer.from(statusString, 'utf8')

      const response = Buffer.concat([
        Buffer.from([0x1c]),
        Buffer.from('1122334455667788', 'hex'),
        Buffer.from('0000000000000000', 'hex'),
        Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex'),
        Buffer.from([0x00, 0xFF]), // Claims 255 bytes but actual is much less
        statusBuffer
      ])

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()

      await expect(protocol.run(state)).rejects.toThrow('Invalid status length')
    })

    it('should throw error when status string has too few fields', async () => {
      const statusString = 'MCPE;Test;1;1;5' // Only 5 fields (need 6)
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()

      await expect(protocol.run(state)).rejects.toThrow('Missing enough chunks')
    })
  })

  describe('run() - special characters and edge cases', () => {
    it('should handle server name with special characters', async () => {
      const statusString = 'MCPE;Test™ Server® [123];527;1.19;10;20'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Test™ Server® [123]')
    })

    it('should handle UTF-8 characters in server name', async () => {
      const statusString = 'MCPE;サーバー;527;1.19;5;10'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('サーバー')
    })

    it('should handle max player count at limits', async () => {
      const statusString = 'MCPE;Huge Server;527;1.19;9999;10000'
      const response = createBedrockResponse(statusString)

      protocol.udpSend = vi.fn().mockImplementation((buf, callback) => {
        return Promise.resolve(callback(response))
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.numplayers).toBe(9999)
      expect(state.maxplayers).toBe(10000)
    })
  })
})
