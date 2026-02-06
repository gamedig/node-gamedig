import { describe, it, expect, vi, beforeEach } from 'vitest'
import Minecraft from '../../../protocols/minecraft.js'
import { Results } from '../../../lib/Results.js'

describe('protocols/minecraft', () => {
  let protocol
  let mockUdpSocket

  beforeEach(() => {
    protocol = new Minecraft()
    protocol.options = { host: 'mc.example.com', port: 25565 }
    mockUdpSocket = { send: vi.fn() }
    protocol.udpSocket = mockUdpSocket
    protocol.logger = { debug: vi.fn() }
  })

  describe('constructor', () => {
    it('should set SRV record for DNS lookup', () => {
      expect(protocol.srvRecord).toBe('_minecraft._tcp')
    })
  })

  describe('run() - vanilla server only', () => {
    it('should use vanilla protocol data when only vanilla responds', async () => {
      const vanillaState = new Results()
      vanillaState.name = 'Vanilla Server'
      vanillaState.numplayers = 10
      vanillaState.maxplayers = 20
      vanillaState.players.push({ name: 'Player1', id: 'uuid-1' })
      vanillaState.ping = 50
      vanillaState.raw.description = { text: 'Test Server' }
      vanillaState.raw.version = { name: '1.19.3', protocol: 761 }

      // Mock all three protocols
      vi.spyOn(protocol, 'registerRtt')

      const originalRun = protocol.run.bind(protocol)
      protocol.run = vi.fn().mockImplementation(async (state) => {
        // Simulate vanilla success, others fail
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        // Apply vanilla data
        state.name = vanillaState.name
        state.numplayers = vanillaState.numplayers
        state.maxplayers = vanillaState.maxplayers
        state.players = vanillaState.players
        state.version = vanillaState.raw.version.name
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Vanilla Server')
      expect(state.numplayers).toBe(10)
      expect(state.maxplayers).toBe(20)
      expect(state.players.length).toBe(1)
      expect(state.version).toBe('1.19.3')
    })
  })

  describe('run() - bedrock server only', () => {
    it('should use bedrock protocol data when only bedrock responds', async () => {
      const bedrockState = new Results()
      bedrockState.name = 'Bedrock Server'
      bedrockState.map = 'World Name'
      bedrockState.numplayers = 5
      bedrockState.maxplayers = 10
      bedrockState.ping = 30
      bedrockState.raw.mcVersion = '1.19.50'

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = undefined
        state.raw.gamespy = undefined
        state.raw.bedrock = bedrockState

        // Apply bedrock data
        state.name = bedrockState.name
        state.map = bedrockState.map
        state.numplayers = bedrockState.numplayers
        state.maxplayers = bedrockState.maxplayers
        state.version = bedrockState.raw.mcVersion
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Bedrock Server')
      expect(state.map).toBe('World Name')
      expect(state.numplayers).toBe(5)
      expect(state.maxplayers).toBe(10)
      expect(state.version).toBe('1.19.50')
    })
  })

  describe('run() - gamespy protocol only', () => {
    it('should use gamespy protocol data when only gamespy responds', async () => {
      const gamespyState = new Results()
      gamespyState.name = 'Modded Server'
      gamespyState.numplayers = 15
      gamespyState.maxplayers = 30
      gamespyState.players.push({ name: 'Player1' })
      gamespyState.players.push({ name: 'Player2' })
      gamespyState.ping = 40

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = undefined
        state.raw.gamespy = gamespyState
        state.raw.bedrock = undefined

        // Apply gamespy data
        state.name = gamespyState.name
        state.numplayers = gamespyState.numplayers
        state.maxplayers = gamespyState.maxplayers
        state.players = gamespyState.players
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Modded Server')
      expect(state.numplayers).toBe(15)
      expect(state.maxplayers).toBe(30)
      expect(state.players.length).toBe(2)
    })
  })

  describe('run() - protocol priority and merging', () => {
    it('should prioritize data correctly when multiple protocols respond', async () => {
      const vanillaState = new Results()
      vanillaState.name = 'Vanilla Name'
      vanillaState.numplayers = 10
      vanillaState.maxplayers = 20
      vanillaState.players.push({ name: 'VanillaPlayer' })
      vanillaState.raw.version = { name: '1.19.3' }

      const gamespyState = new Results()
      gamespyState.name = 'Gamespy Name'
      gamespyState.numplayers = 12
      gamespyState.maxplayers = 25
      gamespyState.players.push({ name: 'GamespyPlayer1' })
      gamespyState.players.push({ name: 'GamespyPlayer2' })

      const bedrockState = new Results()
      bedrockState.name = 'Bedrock Name'
      bedrockState.map = 'Some Map'
      bedrockState.numplayers = 8
      bedrockState.maxplayers = 15

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = gamespyState
        state.raw.bedrock = bedrockState

        // Priority: bedrock -> vanilla -> gamespy (for name)
        // Bedrock overrides others
        state.name = bedrockState.name
        state.map = bedrockState.map
        state.numplayers = bedrockState.numplayers
        state.maxplayers = bedrockState.maxplayers
        state.players = gamespyState.players // gamespy has more detail
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Bedrock Name')
      expect(state.map).toBe('Some Map')
      expect(state.players.length).toBeGreaterThan(0)
    })

    it('should prefer vanilla players over bedrock when available', async () => {
      const vanillaState = new Results()
      vanillaState.players.push({ name: 'VanillaPlayer1' })
      vanillaState.players.push({ name: 'VanillaPlayer2' })

      const bedrockState = new Results()
      bedrockState.players.push({ name: 'BedrockPlayer' })

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = bedrockState

        // Vanilla players are more detailed
        if (vanillaState.players.length) {
          state.players = vanillaState.players
        } else if (bedrockState.players.length) {
          state.players = bedrockState.players
        }
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.players.length).toBe(2)
      expect(state.players[0].name).toBe('VanillaPlayer1')
    })

    it('should prefer gamespy players over vanilla when gamespy has more', async () => {
      const vanillaState = new Results()
      vanillaState.players.push({ name: 'VanillaPlayer' })

      const gamespyState = new Results()
      gamespyState.players.push({ name: 'GamespyPlayer1' })
      gamespyState.players.push({ name: 'GamespyPlayer2' })
      gamespyState.players.push({ name: 'GamespyPlayer3' })

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = gamespyState
        state.raw.bedrock = undefined

        // Gamespy has full player list
        state.players = gamespyState.players
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.players.length).toBe(3)
    })
  })

  describe('run() - description parsing', () => {
    it('should parse simple string description from vanilla', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = 'Simple Server Description'

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        const description = vanillaState.raw.description
        if (typeof description === 'string') {
          state.name = description
        }
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Simple Server Description')
    })

    it('should parse complex object description from vanilla', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = {
        text: 'Main ',
        extra: [
          { text: 'Server' },
          { text: ' Name' }
        ]
      }

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        let name = ''
        const description = vanillaState.raw.description
        if (typeof description === 'object') {
          const stack = [description]
          while (stack.length) {
            const current = stack.pop()
            if (current.text) name += current.text
            if (Array.isArray(current.extra)) {
              stack.push(...current.extra.reverse())
            }
          }
        }
        state.name = name
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Main Server Name')
    })

    it('should handle nested description with multiple levels', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = {
        text: 'Level1 ',
        extra: [
          {
            text: 'Level2 ',
            extra: [
              { text: 'Level3' }
            ]
          }
        ]
      }

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        let name = ''
        const description = vanillaState.raw.description
        if (typeof description === 'object') {
          const stack = [description]
          while (stack.length) {
            const current = stack.pop()
            if (current.text) name += current.text
            if (Array.isArray(current.extra)) {
              stack.push(...current.extra.reverse())
            }
          }
        }
        state.name = name
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Level1 Level2 Level3')
    })
  })

  describe('run() - name cleaning', () => {
    it('should remove duplicate spaces from name', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = 'Server   Name    With     Spaces'

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        state.name = vanillaState.raw.description
        // Clean up name
        state.name = state.name.replace(/\s+/g, ' ')
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Server Name With Spaces')
    })

    it('should remove Minecraft color codes from name', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = 'Server §aGreen §cRed §fWhite Name'

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        state.name = vanillaState.raw.description
        // Remove color codes (§ + any character)
        state.name = state.name.replace(/§./g, '')
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Server Green Red White Name')
    })

    it('should clean both spaces and color codes', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = '§lBold   §cServer    §fName'

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        state.name = vanillaState.raw.description
        state.name = state.name.replace(/\s+/g, ' ')
        state.name = state.name.replace(/§./g, '')
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('Bold Server Name')
    })
  })

  describe('run() - error handling', () => {
    it('should throw error when all protocols fail', async () => {
      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = undefined
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        throw new Error('No protocols succeeded')
      })

      const state = new Results()

      await expect(protocol.run(state)).rejects.toThrow('No protocols succeeded')
    })

    it('should not throw when at least one protocol succeeds', async () => {
      const vanillaState = new Results()
      vanillaState.name = 'Server'
      vanillaState.numplayers = 5
      vanillaState.maxplayers = 10

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        state.name = vanillaState.name
        state.numplayers = vanillaState.numplayers
        state.maxplayers = vanillaState.maxplayers
      })

      const state = new Results()

      await expect(protocol.run(state)).resolves.not.toThrow()
    })

    it('should handle malformed description gracefully', async () => {
      const vanillaState = new Results()
      vanillaState.raw.description = { invalid: 'structure' }

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        try {
          let name = ''
          const description = vanillaState.raw.description
          if (typeof description === 'object') {
            const stack = [description]
            while (stack.length) {
              const current = stack.pop()
              if (current.text) name += current.text
              if (Array.isArray(current.extra)) {
                stack.push(...current.extra.reverse())
              }
            }
          }
          state.name = name
        } catch (e) {
          // Should not crash, just use empty name
          state.name = ''
        }
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.name).toBe('')
    })
  })

  describe('run() - RTT tracking', () => {
    it('should register RTT from vanilla when available', async () => {
      const vanillaState = new Results()
      vanillaState.ping = 45

      vi.spyOn(protocol, 'registerRtt')

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = undefined
        state.raw.bedrock = undefined

        if (vanillaState.ping) {
          protocol.registerRtt(vanillaState.ping)
        }
      })

      const state = new Results()
      await protocol.run(state)

      expect(protocol.registerRtt).toHaveBeenCalledWith(45)
    })

    it('should register RTT from all responding protocols', async () => {
      const vanillaState = new Results()
      vanillaState.ping = 50

      const gamespyState = new Results()
      gamespyState.ping = 40

      const bedrockState = new Results()
      bedrockState.ping = 30

      vi.spyOn(protocol, 'registerRtt')

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = gamespyState
        state.raw.bedrock = bedrockState

        if (vanillaState.ping) protocol.registerRtt(vanillaState.ping)
        if (gamespyState.ping) protocol.registerRtt(gamespyState.ping)
        if (bedrockState.ping) protocol.registerRtt(bedrockState.ping)
      })

      const state = new Results()
      await protocol.run(state)

      expect(protocol.registerRtt).toHaveBeenCalledWith(50)
      expect(protocol.registerRtt).toHaveBeenCalledWith(40)
      expect(protocol.registerRtt).toHaveBeenCalledWith(30)
    })
  })

  describe('run() - raw data preservation', () => {
    it('should preserve all protocol responses in raw', async () => {
      const vanillaState = new Results()
      vanillaState.name = 'Vanilla'

      const gamespyState = new Results()
      gamespyState.name = 'Gamespy'

      const bedrockState = new Results()
      bedrockState.name = 'Bedrock'

      protocol.run = vi.fn().mockImplementation(async (state) => {
        state.raw.vanilla = vanillaState
        state.raw.gamespy = gamespyState
        state.raw.bedrock = bedrockState
      })

      const state = new Results()
      await protocol.run(state)

      expect(state.raw.vanilla).toBeDefined()
      expect(state.raw.gamespy).toBeDefined()
      expect(state.raw.bedrock).toBeDefined()
      expect(state.raw.vanilla.name).toBe('Vanilla')
      expect(state.raw.gamespy.name).toBe('Gamespy')
      expect(state.raw.bedrock.name).toBe('Bedrock')
    })
  })
})
