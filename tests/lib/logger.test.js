import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import Logger from '../../lib/Logger.js'

// Runs `fn` with console.log captured, returning an array of the argument
// lists passed to each console.log call.
const captureLog = (fn) => {
  const calls = []
  const original = console.log
  console.log = (...args) => calls.push(args)
  try {
    fn()
  } finally {
    console.log = original
  }
  return calls
}

describe('Logger.debug', () => {
  it('prints nothing while debugging is disabled', () => {
    const logger = new Logger()
    const calls = captureLog(() => logger.debug('hello'))
    assert.equal(calls.length, 0)
  })

  it('prints once debugging is enabled', () => {
    const logger = new Logger()
    logger.debugEnabled = true
    const calls = captureLog(() => logger.debug('hello'))
    assert.deepEqual(calls, [['hello']])
  })

  it('prepends the prefix when one is set', () => {
    const logger = new Logger()
    logger.debugEnabled = true
    logger.prefix = 'Q#7'
    const calls = captureLog(() => logger.debug('hello', 'world'))
    assert.deepEqual(calls, [['Q#7', 'hello', 'world']])
  })
})

describe('Logger argument conversion', () => {
  it('renders an Error as its stack', () => {
    const logger = new Logger()
    logger.debugEnabled = true
    const error = new Error('boom')
    const calls = captureLog(() => logger.debug(error))
    assert.equal(calls.length, 1)
    assert.equal(calls[0][0], error.stack)
    assert.match(calls[0][0], /boom/)
  })

  it('renders a Buffer via debugDump', () => {
    const logger = new Logger()
    logger.debugEnabled = true
    const calls = captureLog(() => logger.debug(Buffer.from([0xde, 0xad])))
    assert.equal(calls.length, 1)
    assert.match(calls[0][0], /Buffer length: 2 bytes/)
    assert.match(calls[0][0], /de ad/)
  })

  it('evaluates a function argument and logs its return value', () => {
    const logger = new Logger()
    logger.debugEnabled = true
    const calls = captureLog(() => logger.debug(() => 'computed'))
    assert.deepEqual(calls, [['computed']])
  })

  it('lets a function argument print directly via the supplied callback', () => {
    const logger = new Logger()
    logger.debugEnabled = true
    const calls = captureLog(() => logger.debug((log) => { log('inner') }))
    assert.deepEqual(calls, [['inner']])
  })
})
