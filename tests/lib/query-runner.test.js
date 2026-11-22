import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import QueryRunner from '../../lib/QueryRunner.js'

// Builds a QueryRunner with `_attempt` stubbed so no sockets are ever opened.
// Each attempted option set is recorded on `runner.attempted`, and `impl`
// decides whether a given attempt succeeds (returns a value) or fails (throws).
const makeRunner = (impl) => {
  const runner = new QueryRunner({})
  runner.attempted = []
  runner._attempt = async (options) => {
    runner.attempted.push(options)
    return impl(options)
  }
  return runner
}

const fail = () => { throw new Error('attempt failed') }
const ports = (runner) => runner.attempted.map((a) => a.port)

// "ats" (American Truck Simulator) is a valve game with port 27015 and a
// port_query_offset of 1, which makes it ideal for exercising port maths.
describe('QueryRunner port selection', () => {
  it('applies the game query port offset when no port is given', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h' }), /Failed all 1 attempts/)
    assert.deepEqual(ports(runner), [27016])
  })

  it('tries the offset port then the base port when a port is given', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h', port: 27015 }), /Failed all 2 attempts/)
    assert.deepEqual(ports(runner), [27016, 27015])
  })

  it('only tries the given port when givenPortOnly is set', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h', port: 27015, givenPortOnly: true }))
    assert.deepEqual(ports(runner), [27015])
  })

  it('coerces a string port to a number', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h', port: '27015', givenPortOnly: true }))
    assert.deepEqual(ports(runner), [27015])
  })
})

describe('QueryRunner retries and ordering', () => {
  it('repeats every attempt maxRetries times', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h', port: 27015, givenPortOnly: true, maxRetries: 3 }))
    assert.deepEqual(ports(runner), [27015, 27015, 27015])
  })

  it('interleaves attempts across retries by default (breadth-first)', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h', port: 27015, maxRetries: 2 }))
    assert.deepEqual(ports(runner), [27016, 27015, 27016, 27015])
  })

  it('exhausts each attempt before moving on when noBreadthOrder is set', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(runner.run({ type: 'ats', host: 'h', port: 27015, maxRetries: 2, noBreadthOrder: true }))
    assert.deepEqual(ports(runner), [27016, 27016, 27015, 27015])
  })
})

describe('QueryRunner results and caching', () => {
  it('returns the first successful attempt and stops', async () => {
    const runner = makeRunner((options) => {
      if (options.port === 27015) return { ok: true, port: 27015 }
      throw new Error('attempt failed')
    })
    const result = await runner.run({ type: 'ats', host: 'h', port: 27015 })
    assert.deepEqual(result, { ok: true, port: 27015 })
    assert.deepEqual(ports(runner), [27016, 27015])
  })

  it('caches a working port and tries it first next time', async () => {
    const runner = makeRunner((options) => {
      if (options.port === 27015) return { ok: true }
      throw new Error('attempt failed')
    })
    const options = () => ({ type: 'ats', address: '1.2.3.4', port: 27015 })

    await runner.run(options())
    assert.deepEqual(ports(runner), [27016, 27015])

    runner.attempted = []
    await runner.run(options())
    assert.equal(runner.attempted[0].port, 27015)
  })

  it('aggregates failures into a single error', async () => {
    const runner = makeRunner(fail)
    await assert.rejects(
      runner.run({ type: 'ats', host: 'h', port: 27015 }),
      (err) => {
        assert.match(err.message, /Failed all 2 attempts/)
        assert.match(err.stack, /Attempt #1/)
        assert.match(err.stack, /Attempt #2/)
        return true
      }
    )
  })
})
