const EventEmitter = require('events').EventEmitter,
    dns = require('dns'),
    net = require('net'),
    Reader = require('../lib/reader'),
    HexUtil = require('../lib/HexUtil'),
    util = require('util'),
    dnsLookupAsync = util.promisify(dns.lookup),
    dnsResolveAsync = util.promisify(dns.resolve),
    requestAsync = require('request-promise'),
    Promises = require('../lib/Promises');

class Core extends EventEmitter {
    constructor() {
        super();
        this.encoding = 'utf8';
        this.byteorder = 'le';
        this.delimiter = '\0';
        this.srvRecord = null;
        this.abortedPromise = null;

        // Sent to us by QueryRunner
        this.options = null;
        this.udpSocket = null;
        this.shortestRTT = 0;
        this.usedTcp = false;
    }

    async runAllAttempts() {
        let result = null;
        let lastError = null;
        for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
            try {
                result = await this.runOnceSafe();
                result.query.attempts = attempt;
                break;
            } catch (e) {
                lastError = e;
            }
        }

        if (result === null) {
            throw lastError;
        }
        return result;
    }

    // Runs a single attempt with a timeout and cleans up afterward
    async runOnceSafe() {
        let abortCall = null;
        this.abortedPromise = new Promise((resolve,reject) => {
            abortCall = () => reject("Query is finished -- cancelling outstanding promises");
        });

        // Make sure that if this promise isn't attached to, it doesn't throw a unhandled promise rejection
        this.abortedPromise.catch(() => {});

        let timeout;
        try {
            const promise = this.runOnce();
            timeout = Promises.createTimeout(this.options.attemptTimeout, "Attempt");
            return await Promise.race([promise,timeout]);
        } finally {
            timeout && timeout.cancel();
            try {
                abortCall();
            } catch(e) {
                this.debugLog("Error during abort cleanup: " + e.stack);
            }
        }
    }

    async runOnce() {
        const options = this.options;
        if (('host' in options) && !('address' in options)) {
            options.address = await this.parseDns(options.host);
        }

        const state = {
            name: '',
            map: '',
            password: false,

            raw: {},

            maxplayers: 0,
            players: [],
            bots: []
        };

        await this.run(state);

        // because lots of servers prefix with spaces to try to appear first
        state.name = (state.name || '').trim();

        if (!('connect' in state)) {
            state.connect = ''
                + (state.gameHost || this.options.host || this.options.address)
                + ':'
                + (state.gamePort || this.options.port)
        }
        state.ping = this.shortestRTT;
        delete state.gameHost;
        delete state.gamePort;


        return state;
    }

    async run(state) {}

    /**
     * @param {string} host
     * @returns {Promise<string>}
     */
    async parseDns(host) {
        const isIp = (host) => {
            return !!host.match(/\d+\.\d+\.\d+\.\d+/);
        };
        const resolveStandard = async (host) => {
            if(isIp(host)) return host;
            this.debugLog("Standard DNS Lookup: " + host);
            const {address,family} = await dnsLookupAsync(host);
            this.debugLog(address);
            return address;
        };
        const resolveSrv = async (srv,host) => {
            if(isIp(host)) return host;
            this.debugLog("SRV DNS Lookup: " + srv+'.'+host);
            let records;
            try {
                records = await dnsResolveAsync(srv + '.' + host, 'SRV');
                this.debugLog(records);
                if(records.length >= 1) {
                    const record = records[0];
                    this.options.port = record.port;
                    const srvhost = record.name;
                    return await resolveStandard(srvhost);
                }
            } catch(e) {
                this.debugLog(e.toString());
            }
            return await resolveStandard(host);
        };

        if(this.srvRecord) return await resolveSrv(this.srvRecord, host);
        else return await resolveStandard(host);
    }

    /** Param can be a time in ms, or a promise (which will be timed) */
    registerRtt(param) {
        if (param.then) {
            const start = Date.now();
            param.then(() => {
                const end = Date.now();
                const rtt = end - start;
                this.registerRtt(rtt);
            }).catch(() => {});
        } else {
            this.debugLog("Registered RTT: " + param + "ms");
            if (this.shortestRTT === 0 || param < this.shortestRTT) {
                this.shortestRTT = param;
            }
        }
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

    trueTest(str) {
        if(typeof str === 'boolean') return str;
        if(typeof str === 'number') return str !== 0;
        if(typeof str === 'string') {
            if(str.toLowerCase() === 'true') return true;
            if(str.toLowerCase() === 'yes') return true;
            if(str === '1') return true;
        }
        return false;
    }

    assertValidPort(port) {
        if (!port || port < 1 || port > 65535) {
            throw new Error("Invalid tcp/ip port: " + port);
        }
    }

    /**
     * @template T
     * @param {function(Socket):Promise<T>} fn
     * @returns {Promise<T>}
     */
    async withTcp(fn, port) {
        this.usedTcp = true;
        const address = this.options.address;
        if (!port) port = this.options.port;
        this.assertValidPort(port);

        let socket, connectionTimeout;
        try {
            socket = net.connect(port,address);
            socket.setNoDelay(true);

            this.debugLog(log => {
                this.debugLog(address+':'+port+" TCP Connecting");
                const writeHook = socket.write;
                socket.write = (...args) => {
                    log(address+':'+port+" TCP-->");
                    log(HexUtil.debugDump(args[0]));
                    writeHook.apply(socket,args);
                };
                socket.on('error', e => log('TCP Error: ' + e));
                socket.on('close', () => log('TCP Closed'));
                socket.on('data', (data) => {
                    log(address+':'+port+" <--TCP");
                    log(data);
                });
                socket.on('ready', () => log(address+':'+port+" TCP Connected"));
            });

            const connectionPromise = new Promise((resolve,reject) => {
                socket.on('ready', resolve);
                socket.on('close', () => reject(new Error('TCP Connection Refused')));
            });
            this.registerRtt(connectionPromise);
            connectionTimeout = Promises.createTimeout(this.options.socketTimeout, 'TCP Opening');
            await Promise.race([
                connectionPromise,
                connectionTimeout,
                this.abortedPromise
            ]);
            return await fn(socket);
        } finally {
            socket && socket.destroy();
            connectionTimeout && connectionTimeout.cancel();
        }
    }

    /**
     * @template T
     * @param {Socket} socket
     * @param {Buffer|string} buffer
     * @param {function(Buffer):T} ondata
     * @returns Promise<T>
     */
    async tcpSend(socket,buffer,ondata) {
        let timeout;
        try {
            const promise = new Promise(async (resolve, reject) => {
                let received = Buffer.from([]);
                const onData = (data) => {
                    received = Buffer.concat([received, data]);
                    const result = ondata(received);
                    if (result !== undefined) {
                        socket.off('data', onData);
                        resolve(result);
                    }
                };
                socket.on('data', onData);
                socket.write(buffer);
            });
            timeout = Promises.createTimeout(this.options.socketTimeout, 'TCP');
            return await Promise.race([promise, timeout, this.abortedPromise]);
        } finally {
            timeout && timeout.cancel();
        }
    }

    /**
     * @param {Buffer|string} buffer
     * @param {function(Buffer):T} onPacket
     * @param {(function():T)=} onTimeout
     * @returns Promise<T>
     * @template T
     */
    async udpSend(buffer,onPacket,onTimeout) {
        const address = this.options.address;
        const port = this.options.port;
        this.assertValidPort(port);

        if(typeof buffer === 'string') buffer = Buffer.from(buffer,'binary');
        this.debugLog(log => {
            log(address+':'+port+" UDP-->");
            log(HexUtil.debugDump(buffer));
        });

        const socket = this.udpSocket;
        socket.send(buffer, address, port);

        let socketCallback;
        let timeout;
        try {
            const promise = new Promise((resolve, reject) => {
                const start = Date.now();
                let end = null;
                socketCallback = (fromAddress, fromPort, buffer) => {
                    try {
                        if (fromAddress !== address) return;
                        if (fromPort !== port) return;
                        if (end === null) {
                            end = Date.now();
                            const rtt = end-start;
                            this.registerRtt(rtt);
                        }
                        this.debugLog(log => {
                            log(fromAddress + ':' + fromPort + " <--UDP");
                            log(HexUtil.debugDump(buffer));
                        });
                        const result = onPacket(buffer);
                        if (result !== undefined) {
                            this.debugLog("UDP send finished by callback");
                            resolve(result);
                        }
                    } catch(e) {
                        reject(e);
                    }
                };
                socket.addCallback(socketCallback);
            });
            timeout = Promises.createTimeout(this.options.socketTimeout, 'UDP');
            const wrappedTimeout = new Promise((resolve, reject) => {
                timeout.catch((e) => {
                    this.debugLog("UDP timeout detected");
                    if (onTimeout) {
                        try {
                            const result = onTimeout();
                            if (result !== undefined) {
                                this.debugLog("UDP timeout resolved by callback");
                                resolve(result);
                                return;
                            }
                        } catch(e) {
                            reject(e);
                        }
                    }
                    reject(e);
                });
            });
            return await Promise.race([promise, wrappedTimeout, this.abortedPromise]);
        } finally {
            timeout && timeout.cancel();
            socketCallback && socket.removeCallback(socketCallback);
        }
    }

    async request(params) {
        // If we haven't opened a raw tcp socket yet during this query, just open one and then immediately close it.
        // This will give us a much more accurate RTT than using the rtt of the http request.
        if (!this.usedTcp) {
            await this.withTcp(() => {});
        }

        let requestPromise;
        try {
            requestPromise = requestAsync({
                ...params,
                timeout: this.options.socketTimeout,
                resolveWithFullResponse: true
            });
            this.debugLog(log => {
                log(() => params.uri + " HTTP-->");
                requestPromise
                    .then((response) => log(params.uri + " <--HTTP " + response.statusCode))
                    .catch(() => {});
            });
            const wrappedPromise = requestPromise.then(response => {
                if (response.statusCode !== 200) throw new Error("Bad status code: " + response.statusCode);
                return response.body;
            });
            return await Promise.race([wrappedPromise, this.abortedPromise]);
        } finally {
            requestPromise && requestPromise.cancel();
        }
    }

    debugLog(...args) {
        if (!this.options.debug) return;
        try {
            if(args[0] instanceof Buffer) {
                this.debugLog(HexUtil.debugDump(args[0]));
            } else if (typeof args[0] == 'function') {
                const result = args[0].call(undefined, this.debugLog.bind(this));
                if (result !== undefined) {
                    this.debugLog(result);
                }
            } else {
                console.log(...args);
            }
        } catch(e) {
            console.log("Error while debug logging: " + e);
        }
    }
}

module.exports = Core;
