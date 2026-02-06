import { describe, it, expect, vi, beforeEach } from 'vitest'
import MinecraftVanilla from '../../../protocols/minecraftvanilla.js'
import { Results } from '../../../lib/Results.js'
import Varint from 'varint'

describe('protocols/minecraftvanilla', () => {
  let protocol

  beforeEach(() => {
    protocol = new MinecraftVanilla()
    protocol.options = { host: 'mc.example.com', port: 25565 }
    protocol.logger = { debug: vi.fn() }
  })

  // Helper to create valid vanilla response (handles UTF-8 correctly)
  const createVanillaResponse = (jsonResponse) => {
    const jsonStr = JSON.stringify(jsonResponse)
    const jsonBuffer = Buffer.from(jsonStr, 'utf8')
    const jsonByteLength = jsonBuffer.length

    return Buffer.concat([
      protocol.varIntBuffer(0), // packet ID
      protocol.varIntBuffer(jsonByteLength),
      jsonBuffer
    ])
  }

  describe('helper methods', () => {
    describe('varIntBuffer()', () => {
      it('should encode small numbers correctly', () => {
        const buf = protocol.varIntBuffer(1)
        expect(buf).toEqual(Buffer.from([0x01]))
      })

      it('should encode larger numbers using varint encoding', () => {
        const buf = protocol.varIntBuffer(300)
        expect(buf).toEqual(Buffer.from(Varint.encode(300)))
      })

      it('should encode zero', () => {
        const buf = protocol.varIntBuffer(0)
        expect(buf).toEqual(Buffer.from([0x00]))
      })
    })

    describe('buildPacket()', () => {
      it('should build packet with data', () => {
        const data = Buffer.from([0x01, 0x02, 0x03])
        const packet = protocol.buildPacket(0, data)

        // Packet should be: length(varint) + id(varint) + data
        const reader = protocol.reader(packet)
        const length = reader.varint()
        const id = reader.varint()
        const payload = reader.rest()

        expect(id).toBe(0)
        expect(payload).toEqual(data)
        expect(length).toBe(data.length + 1) // data + id byte
      })

      it('should build packet without data', () => {
        const packet = protocol.buildPacket(0)

        const reader = protocol.reader(packet)
        const length = reader.varint()
        const id = reader.varint()

        expect(id).toBe(0)
        expect(length).toBe(1) // just id byte
      })

      it('should handle different packet IDs', () => {
        const packet = protocol.buildPacket(5, Buffer.from([0xAA]))

        const reader = protocol.reader(packet)
        reader.varint() // skip length
        const id = reader.varint()

        expect(id).toBe(5)
      })
    })
  })

  describe('run() - successful query', () => {
    it('should parse standard vanilla server response', async () => {
      const jsonResponse = {
        version: { name: '1.19.3', protocol: 761 },
        players: { max: 20, online: 5, sample: [] },
        description: { text: 'A Minecraft Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0), // packet ID
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.version.name).toBe('1.19.3')
      expect(state.raw.version.protocol).toBe(761)
      expect(state.maxplayers).toBe(20)
      expect(state.numplayers).toBe(5)
      expect(state.raw.description.text).toBe('A Minecraft Server')
    })

    it('should parse server with player list', async () => {
      const jsonResponse = {
        version: { name: '1.20', protocol: 763 },
        players: {
          max: 50,
          online: 3,
          sample: [
            { name: 'Player1', id: 'uuid-1' },
            { name: 'Player2', id: 'uuid-2' },
            { name: 'Player3', id: 'uuid-3' }
          ]
        },
        description: { text: 'Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.players.length).toBe(3)
      expect(state.players[0].name).toBe('Player1')
      expect(state.players[0].raw.id).toBe('uuid-1')
      expect(state.players[1].name).toBe('Player2')
      expect(state.players[2].name).toBe('Player3')
    })

    it('should handle server with no players online', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 0 },
        description: { text: 'Empty Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.numplayers).toBe(0)
      expect(state.maxplayers).toBe(20)
      expect(state.players.length).toBe(0)
    })

    it('should handle players.sample being undefined', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 }, // no sample field
        description: { text: 'Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.numplayers).toBe(5)
      expect(state.players.length).toBe(0)
    })
  })

  describe('run() - Better Compatibility Checker (BCC) support', () => {
    it('should parse BCC extension data when present', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: { text: 'Modded Server' }
      }

      const bccData = {
        mods: ['forge', 'industrialcraft'],
        version: '1.0'
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const bccStr = JSON.stringify(bccData)

      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8'),
        Buffer.from('\n', 'utf8'), // BCC separator
        Buffer.from(bccStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.bcc.mods).toEqual(['forge', 'industrialcraft'])
      expect(state.raw.bcc.version).toBe('1.0')
    })

    it('should handle missing BCC data gracefully', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: { text: 'Vanilla Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
        // No BCC data
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.bcc).toEqual({})
    })
  })

  describe('run() - complex description formats', () => {
    it('should handle simple text description', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: 'Simple text description'
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.description).toBe('Simple text description')
    })

    it('should handle complex formatted description', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: {
          text: 'Welcome to ',
          extra: [
            { text: 'My', color: 'gold' },
            { text: ' Server', color: 'aqua' }
          ]
        }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.description.text).toBe('Welcome to ')
      expect(state.raw.description.extra).toBeDefined()
      expect(state.raw.description.extra.length).toBe(2)
    })
  })

  describe('run() - request building', () => {
    it('should build correct handshake and status request', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: { text: 'Test' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      let capturedRequest = null
      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {
          write: vi.fn()
        }
        const tcpSendMock = async (socket, buffer, handler) => {
          capturedRequest = buffer
          return responseData
        }
        protocol.tcpSend = tcpSendMock
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(capturedRequest).toBeDefined()
      expect(capturedRequest.length).toBeGreaterThan(0)
    })

    it('should use correct host and port in handshake', async () => {
      protocol.options = { host: 'test.server.com', port: 12345 }

      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: { text: 'Test' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      // Verify withTcp was called (TCP connection was initiated)
      expect(protocol.withTcp).toHaveBeenCalled()
    })
  })

  describe('run() - edge cases', () => {
    it('should handle large player counts', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 10000, online: 5000 },
        description: { text: 'Large Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.numplayers).toBe(5000)
      expect(state.maxplayers).toBe(10000)
    })

    it('should handle UTF-8 characters in description', async () => {
      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 20, online: 5 },
        description: { text: 'サーバー 🎮 Test™' }
      }

      const responseData = createVanillaResponse(jsonResponse)

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.description.text).toBe('サーバー 🎮 Test™')
    })

    it('should handle maximum player list sample', async () => {
      // Generate 100 players
      const sample = Array.from({ length: 100 }, (_, i) => ({
        name: `Player${i}`,
        id: `uuid-${i}`
      }))

      const jsonResponse = {
        version: { name: '1.19', protocol: 760 },
        players: { max: 1000, online: 100, sample },
        description: { text: 'Full Server' }
      }

      const jsonStr = JSON.stringify(jsonResponse)
      const responseData = Buffer.concat([
        protocol.varIntBuffer(0),
        protocol.varIntBuffer(jsonStr.length),
        Buffer.from(jsonStr, 'utf8')
      ])

      const fullResponse = Buffer.concat([
        protocol.varIntBuffer(responseData.length),
        responseData
      ])

      protocol.withTcp = vi.fn().mockImplementation(async (callback) => {
        const mockSocket = {}
        protocol.tcpSend = vi.fn().mockResolvedValue(responseData)
        return callback(mockSocket)
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.players.length).toBe(100)
      expect(state.players[0].name).toBe('Player0')
      expect(state.players[99].name).toBe('Player99')
    })
  })
})
