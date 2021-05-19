const EventEmitter = require('events').EventEmitter,
    net = require('net'),
    Reader = require('../lib/reader'),
    HexUtil = require('../lib/HexUtil'),
    got = require('got'),
    Promises = require('../lib/Promises'),
    Logger = require('../lib/Logger'),
    DnsResolver = require('../lib/DnsResolver'),
    Results = require('../lib/Results');

let uid = 0;

class Core extends EventEmitter {
    constructor() {
        super();
        this.encoding = 'utf8';
        this.byteorder = 'le';
        this.delimiter = '\0';
        this.srvRecord = null;
        this.abortedPromise = null;
        this.logger = new Logger();
        this.dnsResolver = new DnsResolver(this.logger);

        // Sent to us by QueryRunner
        this.options = null;
        /** @type GlobalUdpSocket */
        this.udpSocket = null;
        this.shortestRTT = 0;
        this.usedTcp = false;
    }

    // Runs a single attempt with a timeout and cleans up afterward
    async runOnceSafe() {
        if (this.options.debug) {
            this.logger.debugEnabled = true;
        }
        this.logger.prefix = 'Q#' + (uid++);

        this.logger.debug("Starting");
        this.logger.debug("Protocol: " + this.constructor.name);
        this.logger.debug("Options:", this.options);

        let abortCall = null;
        this.abortedPromise = new Promise((resolve,reject) => {
            abortCall = () => reject(new Error("Query is finished -- cancelling outstanding promises"));
        }).catch(() => {
            // Make sure that if this promise isn't attached to, it doesn't throw a unhandled promise rejection
        });

        let timeout;
        try {
            const promise = this.runOnce();
            timeout = Promises.createTimeout(this.options.attemptTimeout, "Attempt");
            const result = await Promise.race([promise, timeout]);
            this.logger.debug("Query was successful");
            return result;
        } catch(e) {
            this.logger.debug("Query failed with error", e);
            throw e;
        } finally {
            timeout && timeout.cancel();
            try {
                abortCall();
            } catch(e) {
                this.logger.debug("Error during abort cleanup: " + e.stack);
            }
        }
    }

    async runOnce() {
        const options = this.options;
        if (('host' in options) && !('address' in options)) {
            const resolved = await this.dnsResolver.resolve(options.host, this.srvRecord);
            options.address = resolved.address;
            if (resolved.port) options.port = resolved.port;
        }

        const state = new Results();

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

        this.logger.debug(log => {
            log("Size of players array: " + state.players.length);
            log("Size of bots array: " + state.bots.length);
        });

        return state;
    }

    async run(/** Results */ state) {}

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
        if (!port) {
            throw new Error("Could not determine port to query. Did you provide a port?");
        }
        if (port < 1 || port > 65535) {
            throw new Error("Invalid tcp/ip port: " + port);
        }
    }

    /**
     * @template T
     * @param {function(NodeJS.Socket):Promise<T>} fn
     * @param {number=} port
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

            // Prevent unhandled 'error' events from dumping straight to console
            socket.on('error', () => {});

            this.debugLog(log => {
                this.debugLog(address+':'+port+" TCP Connecting");
                const writeHook = socket.write;
                socket.write = (...args) => {
                    log(address+':'+port+" TCP-->");
                    log(HexUtil.debugDump(args[0]));
                    writeHook.apply(socket,args);
                };
                socket.on('error', e => log('TCP Error:', e));
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
     * @param {NodeJS.Socket} socket
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
                        socket.removeListener('data', onData);
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
     * @param {function(Buffer):T=} onPacket
     * @param {(function():T)=} onTimeout
     * @returns Promise<T>
     * @template T
     */
    async udpSend(buffer,onPacket,onTimeout) {
        const address = this.options.address;
        const port = this.options.port;
        this.assertValidPort(port);

        if(typeof buffer === 'string') buffer = Buffer.from(buffer,'binary');

        const socket = this.udpSocket;
        await socket.send(buffer, address, port, this.options.debug);

        if (!onPacket && !onTimeout) {
            return null;
        }

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
                        const result = onPacket(buffer);
                        if (result !== undefined) {
                            this.debugLog("UDP send finished by callback");
                            resolve(result);
                        }
                    } catch(e) {
                        reject(e);
                    }
                };
                socket.addCallback(socketCallback, this.options.debug);
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

    async tcpPing() {
        // This will give a much more accurate RTT than using the rtt of an http request.
        if (!this.usedTcp) {
            await this.withTcp(() => {});
        }
    }

    async request(params) {
        await this.tcpPing();

        let requestPromise;
        try {
            requestPromise = got({
                ...params,
                timeout: this.options.socketTimeout
            });
            this.debugLog(log => {
                log(() => params.url + " HTTP-->");
                requestPromise
                    .then((response) => log(params.url + " <--HTTP " + response.statusCode))
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

    /** @deprecated */
    debugLog(...args) {
        this.logger.debug(...args);
    }
}

module.exports = Core;
