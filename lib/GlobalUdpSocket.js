import { createSocket } from 'node:dgram'
import { debugDump } from './HexUtil.js'
import { promisify } from 'node:util'
import Logger from './Logger.js'

export default class GlobalUdpSocket {
  constructor ({ port }) {
    this.socket = null
    this.callbacks = new Set()
    this.debuggingCallbacks = new Set()
    this.logger = new Logger()
    this.port = port
  }

  async _getSocket () {
    if (!this.socket) {
      const udpSocket = createSocket({
        type: 'udp4',
        reuseAddr: true
      })
      udpSocket.unref()
      udpSocket.on('message', (buffer, rinfo) => {
        const fromAddress = rinfo.address
        const fromPort = rinfo.port
        this.logger.debug(log => {
          log(fromAddress + ':' + fromPort + ' <--UDP(' + this.port + ')')
          log(debugDump(buffer))
        })
        for (const callback of this.callbacks) {
          callback(fromAddress, fromPort, buffer)
        }
      })
      udpSocket.on('error', e => {
        this.logger.debug('UDP ERROR:', e)
      })
      await promisify(udpSocket.bind).bind(udpSocket)(this.port)
      this.port = udpSocket.address().port
      this.socket = udpSocket
    }
    return this.socket
  }

  async send (buffer, address, port, debug) {
    const socket = await this._getSocket()

    if (debug) {
      this.logger._print(log => {
        log(address + ':' + port + ' UDP(' + this.port + ')-->')
        log(debugDump(buffer))
      })
    }

    await promisify(socket.send).bind(socket)(buffer, 0, buffer.length, port, address)
  }

  addCallback (callback, debug) {
    this.callbacks.add(callback)
    if (debug) {
      this.debuggingCallbacks.add(callback)
      this.logger.debugEnabled = true
    }
  }

  removeCallback (callback) {
    this.callbacks.delete(callback)
    this.debuggingCallbacks.delete(callback)
    this.logger.debugEnabled = this.debuggingCallbacks.size > 0
  }
}
