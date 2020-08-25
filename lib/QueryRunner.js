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
            if (gameQueryPortOffset && !userOptions.givenPortOnly) {
                attempts.push({
                    ...defaultOptions,
                    ...gameOptions,
                    ...userOptions,
                    port: userOptions.port + gameQueryPortOffset
                });
            }
            if (userOptions.port === gameOptions.port && gameQueryPort && !userOptions.givenPortOnly) {
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

        const numRetries = userOptions.maxAttempts || gameOptions.maxAttempts || defaultOptions.maxAttempts;

        let attemptNum = 0;
        const errors = [];
        for (const attempt of attempts) {
            for (let retry = 0; retry < numRetries; retry++) {
                attemptNum++;
                try {
                    return await this._attempt(attempt);
                } catch (e) {
                    e.stack = 'Attempt #' + attemptNum + ' - Port=' + attempt.port + ' Retry=' + (retry) + ':\n' + e.stack;
                    errors.push(e);
                }
            }
        }

        const err = new Error('Failed all ' + errors.length + ' attempts');
        for (const e of errors) {
            err.stack += '\n' + e.stack;
        }
        throw err;
    }

    async _attempt(options) {
        const core = this.protocolResolver.create(options.protocol);
        core.options = options;
        core.udpSocket = this.udpSocket;
        return await core.runOnceSafe();
    }
}

module.exports = QueryRunner;
