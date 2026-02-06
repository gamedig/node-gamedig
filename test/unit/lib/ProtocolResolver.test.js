import { describe, it, expect } from 'vitest'
import { getProtocol } from '../../../lib/ProtocolResolver.js'
import * as protocols from '../../../protocols/index.js'
import Core from '../../../protocols/core.js'

describe('ProtocolResolver', () => {
  describe('getProtocol()', () => {
    describe('valid protocols', () => {
      it('should return valve protocol instance', () => {
        const protocol = getProtocol('valve')

        expect(protocol).toBeDefined()
        expect(protocol).toBeInstanceOf(Core)
        expect(protocol.constructor.name).toBe('valve')
      })

      it('should return minecraft protocol instance', () => {
        const protocol = getProtocol('minecraft')

        expect(protocol).toBeDefined()
        expect(protocol).toBeInstanceOf(Core)
        expect(protocol.constructor.name).toBe('minecraft')
      })

      it('should return gamespy1 protocol instance', () => {
        const protocol = getProtocol('gamespy1')

        expect(protocol).toBeDefined()
        expect(protocol).toBeInstanceOf(Core)
        expect(protocol.constructor.name).toBe('gamespy1')
      })

      it('should return new instance each time', () => {
        const protocol1 = getProtocol('valve')
        const protocol2 = getProtocol('valve')

        expect(protocol1).not.toBe(protocol2)
        expect(protocol1.constructor.name).toBe(protocol2.constructor.name)
      })
    })

    describe('all available protocols', () => {
      const availableProtocols = Object.keys(protocols)

      availableProtocols.forEach((protocolName) => {
        it(`should instantiate ${protocolName} protocol`, () => {
          const protocol = getProtocol(protocolName)

          expect(protocol).toBeDefined()
          expect(protocol).toBeInstanceOf(Core)
        })
      })

      it('should have at least 50 protocols available', () => {
        expect(availableProtocols.length).toBeGreaterThanOrEqual(50)
      })
    })

    describe('error handling', () => {
      it('should throw error for non-existent protocol', () => {
        expect(() => {
          getProtocol('nonexistent')
        }).toThrow('Protocol definition file missing: nonexistent')
      })

      it('should throw error for invalid protocol name', () => {
        expect(() => {
          getProtocol('fakegame')
        }).toThrow('Protocol definition file missing: fakegame')
      })

      it('should throw error for empty string', () => {
        expect(() => {
          getProtocol('')
        }).toThrow('Protocol definition file missing: ')
      })

      it('should throw error for null', () => {
        expect(() => {
          getProtocol(null)
        }).toThrow()
      })

      it('should throw error for undefined', () => {
        expect(() => {
          getProtocol(undefined)
        }).toThrow()
      })
    })

    describe('protocol properties', () => {
      it('should return protocol with Core methods', () => {
        const protocol = getProtocol('valve')

        expect(typeof protocol.run).toBe('function')
        expect(typeof protocol.runOnceSafe).toBe('function')
        expect(typeof protocol.udpSend).toBe('function')
        expect(typeof protocol.withTcp).toBe('function')
      })

      it('should return protocol with logger', () => {
        const protocol = getProtocol('valve')

        expect(protocol.logger).toBeDefined()
        expect(typeof protocol.logger.debug).toBe('function')
      })

      it('should return protocol with default encoding', () => {
        const protocol = getProtocol('valve')

        expect(protocol.encoding).toBeDefined()
      })
    })

    describe('specific protocols', () => {
      it('should return quake3 protocol with correct type', () => {
        const protocol = getProtocol('quake3')

        expect(protocol.constructor.name).toBe('quake3')
      })

      it('should return minecraftbedrock protocol with correct type', () => {
        const protocol = getProtocol('minecraftbedrock')

        expect(protocol.constructor.name).toBe('minecraftbedrock')
      })

      it('should return teamspeak3 protocol with correct type', () => {
        const protocol = getProtocol('teamspeak3')

        expect(protocol.constructor.name).toBe('teamspeak3')
      })
    })
  })
})
