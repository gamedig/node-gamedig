const dgram = require('dgram'),
    HexUtil = require('./HexUtil');

class GlobalUdpSocket {
    constructor() {
        this.socket = null;
        this.callbacks = new Set();
        this.debug = false;
    }

    _getSocket() {
        if (!this.socket) {
            const udpSocket = this.socket = dgram.createSocket('udp4');
            udpSocket.unref();
            udpSocket.bind();
            udpSocket.on('message', (buffer, rinfo) => {
                for (const cb of this.callbacks) {
                    cb(rinfo.address, rinfo.port, buffer);
                }
            });
            udpSocket.on('error', (e) => {
                if (this.debug) {
                    console.log("UDP ERROR: " + e);
                }
            });
        }
        return this.socket;
    }

    send(buffer, address, port) {
        this._getSocket().send(buffer,0,buffer.length,port,address);
    }

    addCallback(callback) {
        this.callbacks.add(callback);
    }
    removeCallback(callback) {
        this.callbacks.delete(callback);
    }
}

module.exports = GlobalUdpSocket;
