const EventEmitter = require('events').EventEmitter,
    dns = require('dns'),
    net = require('net'),
    async = require('async'),
    Reader = require('../lib/reader'),
    HexUtil = require('../lib/HexUtil');

class Core extends EventEmitter {
    constructor() {
        super();
        this.options = {
            socketTimeout: 1000,
            attemptTimeout: 10000,
            maxAttempts: 1
        };
        this.attempt = 1;
        this.finished = false;
        this.encoding = 'utf8';
        this.byteorder = 'le';
        this.delimiter = '\0';
        this.srvRecord = null;
        this.attemptTimeoutTimer = null;
    }

    fatal(err,noretry) {
        if(!noretry && this.attempt < this.options.maxAttempts) {
            this.attempt++;
            this.start();
            return;
        }

        this.done({error: err.toString()});
    }

    initState() {
        return {
            name: '',
            map: '',
            password: false,

            raw: {},

            maxplayers: 0,
            players: [],
            bots: []
        };
    }

    finalizeState(state) {}

    finish(state) {
        this.finalizeState(state);
        this.done(state);
    }

    done(state) {
        if(this.finished) return;

        if(this.options.notes)
            state.notes = this.options.notes;

        state.query = {};
        if('host' in this.options) state.query.host = this.options.host;
        if('address' in this.options) state.query.address = this.options.address;
        if('port' in this.options) state.query.port = this.options.port;
        if('port_query' in this.options) state.query.port_query = this.options.port_query;
        state.query.type = this.type;
        if('pretty' in this) state.query.pretty = this.pretty;
        state.query.duration = Date.now() - this.startMillis;
        state.query.attempts = this.attempt;

        this.reset();
        this.finished = true;
        this.emit('finished',state);
        if(this.options.callback) this.options.callback(state);
    }

    reset() {
        clearTimeout(this.attemptTimeoutTimer);
        if(this.timers) {
            for (const timer of this.timers) {
                clearTimeout(timer);
            }
        }
        this.timers = [];

        if(this.tcpSocket) {
            this.tcpSocket.destroy();
            delete this.tcpSocket;
        }

        this.udpTimeoutTimer = false;
        this.udpCallback = false;
    }

    start() {
        const options = this.options;
        this.reset();

        this.startMillis = Date.now();

        this.attemptTimeoutTimer = setTimeout(() => {
            this.fatal('timeout');
        },this.options.attemptTimeout);

        async.series([
            (c) => {
                // resolve host names
                if(!('host' in options)) return c();
                if(options.host.match(/\d+\.\d+\.\d+\.\d+/)) {
                    options.address = options.host;
                    c();
                } else {
                    this.parseDns(options.host,c);
                }
            },
            (c) => {
                // calculate query port if needed
                if(!('port_query' in options) && 'port' in options) {
                    const offset = options.port_query_offset || 0;
                    options.port_query = options.port + offset;
                }
                c();
            },
            (c) => {
                // run
                this.run(this.initState());
            }

        ]);
    }

    parseDns(host,c) {
        const resolveStandard = (host,c) => {
            if(this.debug) console.log("Standard DNS Lookup: " + host);
            dns.lookup(host, (err,address,family) => {
                if(err) return this.fatal(err);
                if(this.debug) console.log(address);
                this.options.address = address;
                c();
            });
        };

        const resolveSrv = (srv,host,c) => {
            if(this.debug) console.log("SRV DNS Lookup: " + srv+'.'+host);
            dns.resolve(srv+'.'+host, 'SRV', (err,addresses) => {
                if(this.debug) console.log(err, addresses);
                if(err) return resolveStandard(host,c);
                if(addresses.length >= 1) {
                    const line = addresses[0];
                    this.options.port = line.port;
                    const srvhost = line.name;

                    if(srvhost.match(/\d+\.\d+\.\d+\.\d+/)) {
                        this.options.address = srvhost;
                        c();
                    } else {
                        // resolve yet again
                        resolveStandard(srvhost,c);
                    }
                    return;
                }
                return resolveStandard(host,c);
            });
        };

        if(this.srvRecord) resolveSrv(this.srvRecord,host,c);
        else resolveStandard(host,c);
    }

    // utils
    /** @returns {Reader} */
    reader(buffer) {
        return new Reader(this,buffer);
    }
    translate(obj,trans) {
        for(const from of Object.keys(trans)) {
            const to = trans[from];
            if(from in obj) {
                if(to) obj[to] = obj[from];
                delete obj[from];
            }
        }
    }
    setTimeout(c,t) {
        if(this.finished) return 0;
        const id = setTimeout(c,t);
        this.timers.push(id);
        return id;
    }

    trueTest(str) {
        if(typeof str === 'boolean') return str;
        if(typeof str === 'number') return str !== 0;
        if(typeof str === 'string') {
            if(str.toLowerCase() === 'true') return true;
            if(str === 'yes') return true;
            if(str === '1') return true;
        }
        return false;
    }

    _tcpConnect(c) {
        if(this.tcpSocket) return c(this.tcpSocket);

        let connected = false;
        let received = Buffer.from([]);
        const address = this.options.address;
        const port = this.options.port_query;

        const socket = this.tcpSocket = net.connect(port,address,() => {
            if(this.debug) console.log(address+':'+port+" TCPCONNECTED");
            connected = true;
            c(socket);
        });
        socket.setNoDelay(true);
        if(this.debug) console.log(address+':'+port+" TCPCONNECT");

        const writeHook = socket.write;
        socket.write = (...args) => {
            if(this.debug) {
                console.log(address+':'+port+" TCP-->");
                console.log(HexUtil.debugDump(args[0]));
            }
            writeHook.apply(socket,args);
        };

        socket.on('error', () => {});
        socket.on('close', () => {
            if(!this.tcpCallback) return;
            if(connected) return this.fatal('Socket closed while waiting on TCP');
            else return this.fatal('TCP Connection Refused');
        });
        socket.on('data', (data) => {
            if(!this.tcpCallback) return;
            if(this.debug) {
                console.log(address+':'+port+" <--TCP");
                console.log(HexUtil.debugDump(data));
            }
            received = Buffer.concat([received,data]);
            if(this.tcpCallback(received)) {
                clearTimeout(this.tcpTimeoutTimer);
                this.tcpCallback = false;
                received = Buffer.from([]);
            }
        });
    }
    tcpSend(buffer,ondata) {
        process.nextTick(() => {
            if(this.tcpCallback) return this.fatal('Attempted to send TCP packet while still waiting on a managed response');
            this._tcpConnect((socket) => {
                socket.write(buffer);
            });
            if(!ondata) return;

            this.tcpTimeoutTimer = this.setTimeout(() => {
                this.tcpCallback = false;
                this.fatal('TCP Watchdog Timeout');
            },this.options.socketTimeout);
            this.tcpCallback = ondata;
        });
    }

    udpSend(buffer,onpacket,ontimeout) {
        process.nextTick(() => {
            if(this.udpCallback) return this.fatal('Attempted to send UDP packet while still waiting on a managed response');
            this._udpSendNow(buffer);
            if(!onpacket) return;

            this.udpTimeoutTimer = this.setTimeout(() => {
                this.udpCallback = false;
                let timeout = false;
                if(!ontimeout || ontimeout() !== true) timeout = true;
                if(timeout) this.fatal('UDP Watchdog Timeout');
            },this.options.socketTimeout);
            this.udpCallback = onpacket;
        });
    }
    _udpSendNow(buffer) {
        if(!('port_query' in this.options)) return this.fatal('Attempted to send without setting a port');
        if(!('address' in this.options)) return this.fatal('Attempted to send without setting an address');

        if(typeof buffer === 'string') buffer = Buffer.from(buffer,'binary');

        if(this.debug) {
            console.log(this.options.address+':'+this.options.port_query+" UDP-->");
            console.log(HexUtil.debugDump(buffer));
        }
        this.udpSocket.send(buffer,0,buffer.length,this.options.port_query,this.options.address);
    }
    _udpResponse(buffer) {
        if(this.udpCallback) {
            const result = this.udpCallback(buffer);
            if(result === true) {
                // we're done with this udp session
                clearTimeout(this.udpTimeoutTimer);
                this.udpCallback = false;
            }
        } else {
            this.udpResponse(buffer);
        }
    }
    udpResponse() {}
}

module.exports = Core;
