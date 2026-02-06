import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Logger from '../../../lib/Logger.js'
import { Buffer } from 'node:buffer'

describe('Logger', () => {
  let logger
  let consoleLogSpy

  beforeEach(() => {
    logger = new Logger()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('constructor', () => {
    it('should create logger with debugEnabled false by default', () => {
      expect(logger.debugEnabled).toBe(false)
    })

    it('should create logger with empty prefix by default', () => {
      expect(logger.prefix).toBe('')
    })
  })

  describe('debug()', () => {
    describe('when debugEnabled is false', () => {
      it('should not log when debugEnabled is false', () => {
        logger.debugEnabled = false
        logger.debug('test message')

        expect(consoleLogSpy).not.toHaveBeenCalled()
      })

      it('should not log multiple arguments when disabled', () => {
        logger.debugEnabled = false
        logger.debug('arg1', 'arg2', 'arg3')

        expect(consoleLogSpy).not.toHaveBeenCalled()
      })
    })

    describe('when debugEnabled is true', () => {
      beforeEach(() => {
        logger.debugEnabled = true
      })

      it('should log string message', () => {
        logger.debug('test message')

        expect(consoleLogSpy).toHaveBeenCalledWith('test message')
      })

      it('should log multiple arguments', () => {
        logger.debug('arg1', 'arg2', 'arg3')

        expect(consoleLogSpy).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
      })

      it('should log numbers', () => {
        logger.debug(42, 3.14)

        expect(consoleLogSpy).toHaveBeenCalledWith(42, 3.14)
      })

      it('should log objects', () => {
        const obj = { foo: 'bar' }
        logger.debug(obj)

        expect(consoleLogSpy).toHaveBeenCalledWith(obj)
      })
    })
  })

  describe('prefix handling', () => {
    beforeEach(() => {
      logger.debugEnabled = true
    })

    it('should prepend prefix to messages', () => {
      logger.prefix = '[PREFIX]'
      logger.debug('message')

      expect(consoleLogSpy).toHaveBeenCalledWith('[PREFIX]', 'message')
    })

    it('should prepend prefix to multiple arguments', () => {
      logger.prefix = 'Q#123'
      logger.debug('arg1', 'arg2')

      expect(consoleLogSpy).toHaveBeenCalledWith('Q#123', 'arg1', 'arg2')
    })

    it('should not add prefix when empty', () => {
      logger.prefix = ''
      logger.debug('message')

      expect(consoleLogSpy).toHaveBeenCalledWith('message')
    })

    it('should allow changing prefix', () => {
      logger.prefix = 'PREFIX1'
      logger.debug('msg1')

      logger.prefix = 'PREFIX2'
      logger.debug('msg2')

      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'PREFIX1', 'msg1')
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'PREFIX2', 'msg2')
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      logger.debugEnabled = true
    })

    it('should log Error stack trace', () => {
      const error = new Error('Test error')
      logger.debug(error)

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Test error'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('at '))
    })

    it('should log multiple errors', () => {
      const error1 = new Error('Error 1')
      const error2 = new Error('Error 2')
      logger.debug(error1, error2)

      const callArgs = consoleLogSpy.mock.calls[0]
      expect(callArgs[0]).toContain('Error: Error 1')
      expect(callArgs[1]).toContain('Error: Error 2')
    })
  })

  describe('Buffer handling', () => {
    beforeEach(() => {
      logger.debugEnabled = true
    })

    it('should convert Buffer to hex dump', () => {
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]) // "Hello"
      logger.debug(buffer)

      expect(consoleLogSpy).toHaveBeenCalled()
      // Should output hex representation
      const output = consoleLogSpy.mock.calls[0][0]
      expect(typeof output).toBe('string')
    })

    it('should handle empty Buffer', () => {
      const buffer = Buffer.from([])
      logger.debug(buffer)

      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should handle Buffer with other arguments', () => {
      const buffer = Buffer.from([0x01, 0x02])
      logger.debug('Buffer:', buffer, 'end')

      expect(consoleLogSpy).toHaveBeenCalled()
      const args = consoleLogSpy.mock.calls[0]
      expect(args[0]).toBe('Buffer:')
      expect(args[2]).toBe('end')
    })
  })

  describe('function handling (lazy logging)', () => {
    beforeEach(() => {
      logger.debugEnabled = true
    })

    it('should execute function and log its side effects', () => {
      const fn = (log) => {
        log('lazy message')
      }
      logger.debug(fn)

      expect(consoleLogSpy).toHaveBeenCalledWith('lazy message')
    })

    it('should return undefined from function by default', () => {
      const fn = (log) => {
        log('side effect')
      }
      logger.debug(fn)

      // Function should be called but return value shouldn't be logged
      expect(consoleLogSpy).toHaveBeenCalledWith('side effect')
    })

    it('should log return value if function returns something', () => {
      const fn = () => {
        return 'returned value'
      }
      logger.debug(fn)

      expect(consoleLogSpy).toHaveBeenCalledWith('returned value')
    })

    it('should handle function with multiple log calls', () => {
      const fn = (log) => {
        log('message 1')
        log('message 2')
      }
      logger.debug(fn)

      expect(consoleLogSpy).toHaveBeenCalledWith('message 1')
      expect(consoleLogSpy).toHaveBeenCalledWith('message 2')
    })

    it('should provide log callback to function', () => {
      let logCallbackProvided = false
      const fn = (log) => {
        logCallbackProvided = typeof log === 'function'
      }
      logger.debug(fn)

      expect(logCallbackProvided).toBe(true)
    })
  })

  describe('mixed argument types', () => {
    beforeEach(() => {
      logger.debugEnabled = true
    })

    it('should handle mix of strings, numbers, and objects', () => {
      logger.debug('Server:', { port: 27015 }, 'online:', true, 'players:', 5)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Server:',
        { port: 27015 },
        'online:',
        true,
        'players:',
        5
      )
    })

    it('should handle empty arguments', () => {
      logger.debug()

      // Should not log anything when no args
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  describe('error handling in logging', () => {
    beforeEach(() => {
      logger.debugEnabled = true
    })

    it('should catch and log errors during logging', () => {
      // Create a scenario that could cause logging to fail
      const problematic = { toJSON: () => { throw new Error('Cannot serialize') } }

      // Logger should catch internal errors
      expect(() => {
        logger.debug('Safe text', problematic)
      }).not.toThrow()
    })

    it('should handle circular references gracefully', () => {
      const circular = { name: 'test' }
      circular.self = circular

      // Should not throw even with circular reference
      expect(() => {
        logger.debug(circular)
      }).not.toThrow()
    })
  })

  describe('real-world usage patterns', () => {
    beforeEach(() => {
      logger.debugEnabled = true
      logger.prefix = 'Q#42'
    })

    it('should log query start message', () => {
      logger.debug('Starting')

      expect(consoleLogSpy).toHaveBeenCalledWith('Q#42', 'Starting')
    })

    it('should log protocol information', () => {
      logger.debug('Protocol: valve')
      logger.debug('Options:', { host: '127.0.0.1', port: 27015 })

      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'Q#42', 'Protocol: valve')
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, 'Q#42', 'Options:', { host: '127.0.0.1', port: 27015 })
    })

    it('should log network operations with lazy evaluation', () => {
      logger.debug(log => {
        log('127.0.0.1:27015 TCP-->')
        log(Buffer.from([0xff, 0xff, 0xff, 0xff]))
      })

      expect(consoleLogSpy).toHaveBeenCalledWith('Q#42', '127.0.0.1:27015 TCP-->')
    })

    it('should log errors with context', () => {
      const error = new Error('Connection timeout')
      logger.debug('Query failed with error', error)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Q#42',
        'Query failed with error',
        expect.stringContaining('Error: Connection timeout')
      )
    })
  })
})
