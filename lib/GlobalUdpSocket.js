const dgram = require('dgram'),
    HexUtil = require('./HexUtil');

class GlobalUdpSocket {
    constructor() {
        this.socket = null;
        this.callbacks = new Set();
        this.debuggingCallbacks = new Set();
    }

    _getSocket() {
        if (!this.socket) {
            const udpSocket = this.socket = dgram.createSocket('udp4');
            udpSocket.unref();
            udpSocket.bind();
            udpSocket.on('message', (buffer, rinfo) => {
                const fromAddress = rinfo.address;
                const fromPort = rinfo.port;
                if (this.debuggingCallbacks.size) {
                    console.log(fromAddress + ':' + fromPort + " <--UDP");
                    console.log(HexUtil.debugDump(buffer));
                }
                for (const cb of this.callbacks) {
                    cb(fromAddress, fromPort, buffer);
                }
            });
            udpSocket.on('error', (e) => {
                if (this.debuggingCallbacks.size) {
                    console.log("UDP ERROR: " + e);
                }
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
        }
    }
    removeCallback(callback) {
        this.callbacks.delete(callback);
        this.debuggingCallbacks.delete(callback);
    }
}

module.exports = GlobalUdpSocket;
