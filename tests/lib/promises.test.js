import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Promises from '../../lib/Promises.js'

// These guard the timeout primitive that backs every socket/attempt timeout.
// See gamedig/node-gamedig#611, where a regression meant TCP timeouts silently
// stopped firing - exactly the kind of behaviour a unit test pins down.
describe('Promises.createTimeout', () => {
  it('rejects with the given message after the timeout elapses', async () => {
    const timeout = Promises.createTimeout(10, 'UDP')
    await assert.rejects(timeout, /UDP - Timed out after 10ms/)
  })

  it('never settles once cancelled', async () => {
    const timeout = Promises.createTimeout(10, 'TCP')
    timeout.cancel()

    const outcome = await Promise.race([
      timeout.then(() => 'settled', () => 'settled'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 40))
    ])

    assert.equal(outcome, 'pending')
  })

  it('exposes a cancel function on the returned promise', () => {
    const timeout = Promises.createTimeout(10, 'X')
    assert.equal(typeof timeout.cancel, 'function')
    timeout.cancel()
    // swallow the (now cancelled) promise so it cannot become unhandled
    timeout.catch(() => {})
  })
})
