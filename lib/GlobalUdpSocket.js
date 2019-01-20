const dgram = require('dgram'),
    HexUtil = require('./HexUtil'),
    Logger = require('./Logger');

class GlobalUdpSocket {
    constructor() {
        this.socket = null;
        this.callbacks = new Set();
        this.debuggingCallbacks = new Set();
        this.logger = new Logger();
    }

    _getSocket() {
        if (!this.socket) {
            const udpSocket = this.socket = dgram.createSocket('udp4');
            udpSocket.unref();
            udpSocket.bind();
            udpSocket.on('message', (buffer, rinfo) => {
                const fromAddress = rinfo.address;
                const fromPort = rinfo.port;
                this.logger.debug(log => {
                    log(fromAddress + ':' + fromPort + " <--UDP");
                    log(HexUtil.debugDump(buffer));
                });
                for (const cb of this.callbacks) {
                    cb(fromAddress, fromPort, buffer);
                }
            });
            udpSocket.on('error', e => {
                this.logger.debug("UDP ERROR:", e);
            });
        }
        return this.socket;
    }

    send(buffer, address, port) {
        this._getSocket().send(buffer,0,buffer.length,port,address);
    }

    addCallback(callback, debug) {
        this.callbacks.add(callback);
        if (debug) {
            this.debuggingCallbacks.add(callback);
            this.logger.debugEnabled = true;
        }
    }
    removeCallback(callback) {
        this.callbacks.delete(callback);
        this.debuggingCallbacks.delete(callback);
        this.logger.debugEnabled = this.debuggingCallbacks.size > 0;
    }
}

module.exports = GlobalUdpSocket;
