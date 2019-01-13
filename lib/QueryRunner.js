const GameResolver = require('./GameResolver'),
    ProtocolResolver = require('./ProtocolResolver'),
    GlobalUdpSocket = require('./GlobalUdpSocket');

const defaultOptions = {
    socketTimeout: 2000,
    attemptTimeout: 10000,
    maxAttempts: 1
};

class QueryRunner {
    constructor() {
        this.udpSocket = new GlobalUdpSocket();
        this.gameResolver = new GameResolver();
        this.protocolResolver = new ProtocolResolver();
    }
    async run(userOptions) {
        for (const key of Object.keys(userOptions)) {
            const value = userOptions[key];
            if (['port'].includes(key)) {
                userOptions[key] = parseInt(value);
            }
        }

        const {
            port_query: gameQueryPort,
            port_query_offset: gameQueryPortOffset,
            ...gameOptions
        } = this.gameResolver.lookup(userOptions.type);
        const attempts = [];

        if (userOptions.port) {
            if (gameQueryPortOffset) {
                attempts.push({
                    ...defaultOptions,
                    ...gameOptions,
                    ...userOptions,
                    port: userOptions.port + gameQueryPortOffset
                });
            }
            if (userOptions.port === gameOptions.port && gameQueryPort) {
                attempts.push({
                    ...defaultOptions,
                    ...gameOptions,
                    ...userOptions,
                    port: gameQueryPort
                });
            }
            attempts.push({
                ...defaultOptions,
                ...gameOptions,
                ...userOptions
            });
        } else if (gameQueryPort) {
            attempts.push({
                ...defaultOptions,
                ...gameOptions,
                ...userOptions,
                port: gameQueryPort
            });
        } else if (gameOptions.port) {
            attempts.push({
                ...defaultOptions,
                ...gameOptions,
                ...userOptions,
                port: gameOptions.port + (gameQueryPortOffset || 0)
            });
        } else {
            throw new Error("Could not determine port to query. Did you provide a port or gameid?");
        }

        if (attempts.length === 1) {
            return await this._attempt(attempts[0]);
        } else {
            const errors = [];
            for (const attempt of attempts) {
                try {
                    return await this._attempt(attempt);
                } catch(e) {
                    const e2 = new Error('Failed to query port ' + attempt.port);
                    e2.stack += "\nCaused by:\n" + e.stack;
                    errors.push(e2);
                }
            }

            const err = new Error('Failed all port attempts');
            err.stack = errors.map(e => e.stack).join('\n');
            throw err;
        }
    }

    async _attempt(options) {
        if (options.debug) {
            console.log("Running attempt with options:");
            console.log(options);
        }
        const core = this.protocolResolver.create(options.protocol);
        core.options = options;
        core.udpSocket = this.udpSocket;
        return await core.runAllAttempts();
    }
}

module.exports = QueryRunner;
