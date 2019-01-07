const EventEmitter = require('events').EventEmitter,
    dns = require('dns'),
    net = require('net'),
    Reader = require('../lib/reader'),
    HexUtil = require('../lib/HexUtil'),
    util = require('util'),
    dnsLookupAsync = util.promisify(dns.lookup),
    dnsResolveAsync = util.promisify(dns.resolve);

class Core extends EventEmitter {
    constructor() {
        super();
        this.options = {
            socketTimeout: 2000,
            attemptTimeout: 10000,
            maxAttempts: 1
        };
        this.encoding = 'utf8';
        this.byteorder = 'le';
        this.delimiter = '\0';
        this.srvRecord = null;

        this.attemptAbortables = new Set();
        this.udpCallback = null;
        this.udpLocked = false;
        this.lastAbortableId = 0;
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

    // Run all attempts
    async runAll() {
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
        try {
            const result = await this.timedPromise(this.runOnce(), this.options.attemptTimeout, "Attempt");
            if (this.attemptAbortables.size) {
                let out = [];
                for (const abortable of this.attemptAbortables) {
                    out.push(abortable.id + " " + abortable.stack);
                }
                throw new Error('Query succeeded, but abortables were not empty (async leak?):\n' + out.join('\n---\n'));
            }
            return result;
        } finally {
            // Clean up any lingering long-running functions
            for (const abortable of this.attemptAbortables) {
                try {
                    abortable.abort();
                } catch(e) {}
            }
            this.attemptAbortables.clear();
        }
    }

    timedPromise(promise, timeoutMs, timeoutMsg) {
        return new Promise((resolve, reject) => {
            const cancelTimeout = this.setTimeout(
                () => reject(new Error(timeoutMsg + " - Timed out after " + timeoutMs + "ms")),
                timeoutMs
            );
            promise.finally(cancelTimeout).then(resolve,reject);
        });
    }

    async runOnce() {
        const startMillis = Date.now();
        const options = this.options;
        if (('host' in options) && !('address' in options)) {
            options.address = await this.parseDns(options.host);
        }
        if(!('port_query' in options) && 'port' in options) {
            const offset = options.port_query_offset || 0;
            options.port_query = options.port + offset;
        }

        const state = this.initState();
        await this.run(state);

        if (this.options.notes)
            state.notes = this.options.notes;

        state.query = {};
        if ('host' in this.options) state.query.host = this.options.host;
        if ('address' in this.options) state.query.address = this.options.address;
        if ('port' in this.options) state.query.port = this.options.port;
        if ('port_query' in this.options) state.query.port_query = this.options.port_query;
        state.query.type = this.type;
        if ('pretty' in this) state.query.pretty = this.pretty;
        state.query.duration = Date.now() - startMillis;

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
            if(this.debug) console.log("Standard DNS Lookup: " + host);
            const {address,family} = await dnsLookupAsync(host);
            if(this.debug) console.log(address);
            return address;
        };
        const resolveSrv = async (srv,host) => {
            if(isIp(host)) return host;
            if(this.debug) console.log("SRV DNS Lookup: " + srv+'.'+host);
            let records;
            try {
                records = await dnsResolveAsync(srv + '.' + host, 'SRV');
                if(this.debug) console.log(records);
                if(records.length >= 1) {
                    const record = records[0];
                    this.options.port = record.port;
                    const srvhost = record.name;
                    return await resolveStandard(srvhost);
                }
            } catch(e) {
                if (this.debug) console.log(e.toString());
            }
            return await resolveStandard(host);
        };

        if(this.srvRecord) return await resolveSrv(this.srvRecord, host);
        else return await resolveStandard(host);
    }

    addAbortable(fn) {
        const id = ++this.lastAbortableId;
        const stack = new Error().stack;
        const entry = { id: id, abort: fn, stack: stack };
        if (this.debug) console.log("Adding abortable: " + id);
        this.attemptAbortables.add(entry);
        return () => {
            if (this.debug) console.log("Removing abortable: " + id);
            this.attemptAbortables.delete(entry);
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

    /**
     * @param {function(Socket):Promise} fn
     * @returns {Promise<Socket>}
     */
    async withTcp(fn) {
        const address = this.options.address;
        const port = this.options.port_query;

        const socket = net.connect(port,address);
        socket.setNoDelay(true);
        const cancelAbortable = this.addAbortable(() => socket.destroy());

        if(this.debug) {
            console.log(address+':'+port+" TCP Connecting");
            const writeHook = socket.write;
            socket.write = (...args) => {
                console.log(address+':'+port+" TCP-->");
                console.log(HexUtil.debugDump(args[0]));
                writeHook.apply(socket,args);
            };
            socket.on('error', e => console.log('TCP Error: ' + e));
            socket.on('close', () => console.log('TCP Closed'));
            socket.on('data', (data) => {
                if(this.debug) {
                    console.log(address+':'+port+" <--TCP");
                    console.log(HexUtil.debugDump(data));
                }
            });
            socket.on('ready', () => console.log(address+':'+port+" TCP Connected"));
        }

        try {
            await this.timedPromise(
                new Promise((resolve,reject) => {
                    socket.on('ready', resolve);
                    socket.on('close', () => reject(new Error('TCP Connection Refused')));
                }),
                this.options.socketTimeout,
                'TCP Opening'
            );
            return await fn(socket);
        } finally {
            cancelAbortable();
            socket.destroy();
        }
    }

    setTimeout(callback, time) {
        let cancelAbortable;
        const onTimeout = () => {
            cancelAbortable();
            callback();
        };
        const timeout = setTimeout(onTimeout, time);
        cancelAbortable = this.addAbortable(() => clearTimeout(timeout));
        return () => {
            cancelAbortable();
            clearTimeout(timeout);
        }
    }

    /**
     * @param {Socket} socket
     * @param {Buffer} buffer
     * @param {function(Buffer):boolean} ondata
     * @returns {Promise}
     */
    async tcpSend(socket,buffer,ondata) {
        return await this.timedPromise(
            new Promise(async (resolve,reject) => {
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
            }),
            this.options.socketTimeout,
            'TCP'
        );
    }

    async withUdpLock(fn) {
        if (this.udpLocked) {
            throw new Error('Attempted to lock UDP when already locked');
        }
        this.udpLocked = true;
        try {
            return await fn();
        } finally {
            this.udpLocked = false;
            this.udpCallback = null;
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
        if(!('port_query' in this.options)) throw new Error('Attempted to send without setting a port');
        if(!('address' in this.options)) throw new Error('Attempted to send without setting an address');
        if(typeof buffer === 'string') buffer = Buffer.from(buffer,'binary');
        if(this.debug) {
            console.log(this.options.address+':'+this.options.port_query+" UDP-->");
            console.log(HexUtil.debugDump(buffer));
        }

        return await this.withUdpLock(async() => {
            this.udpSocket.send(buffer,0,buffer.length,this.options.port_query,this.options.address);

            return await new Promise((resolve,reject) => {
                const cancelTimeout = this.setTimeout(() => {
                    if (this.debug) console.log("UDP timeout detected");
                    let success = false;
                    if (onTimeout) {
                        const result = onTimeout();
                        if (result !== undefined) {
                            if (this.debug) console.log("UDP timeout resolved by callback");
                            resolve(result);
                            success = true;
                        }
                    }
                    if (!success) {
                        reject(new Error('UDP Watchdog Timeout'));
                    }
                },this.options.socketTimeout);

                this.udpCallback = (buffer) => {
                    const result = onPacket(buffer);
                    if(result !== undefined) {
                        if (this.debug) console.log("UDP send finished by callback");
                        cancelTimeout();
                        resolve(result);
                    }
                };
            });
        });
    }

    _udpIncoming(buffer) {
        this.udpCallback && this.udpCallback(buffer);
    }
}

module.exports = Core;
