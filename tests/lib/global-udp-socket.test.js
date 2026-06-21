import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import GlobalUdpSocket from '../../lib/GlobalUdpSocket.js'

// These exercise the callback bookkeeping only; the underlying dgram socket is
// lazily created on first send, so nothing here binds a real port.
describe('GlobalUdpSocket callbacks', () => {
  it('registers and removes callbacks', () => {
    const socket = new GlobalUdpSocket({})
    const callback = () => {}

    socket.addCallback(callback, false)
    assert.ok(socket.callbacks.has(callback))

    socket.removeCallback(callback)
    assert.ok(!socket.callbacks.has(callback))
  })

  it('does not enable debugging for a non-debug callback', () => {
    const socket = new GlobalUdpSocket({})
    socket.addCallback(() => {}, false)
    assert.equal(socket.logger.debugEnabled, false)
  })

  it('enables debugging while a debug callback is registered', () => {
    const socket = new GlobalUdpSocket({})
    const callback = () => {}

    socket.addCallback(callback, true)
    assert.equal(socket.logger.debugEnabled, true)

    socket.removeCallback(callback)
    assert.equal(socket.logger.debugEnabled, false)
  })

  it('keeps debugging enabled until the last debug callback is removed', () => {
    const socket = new GlobalUdpSocket({})
    const a = () => {}
    const b = () => {}

    socket.addCallback(a, true)
    socket.addCallback(b, true)

    socket.removeCallback(a)
    assert.equal(socket.logger.debugEnabled, true)

    socket.removeCallback(b)
    assert.equal(socket.logger.debugEnabled, false)
  })
})
