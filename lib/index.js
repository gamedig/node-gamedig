const QueryRunner = require('./QueryRunner'),
    GlobalUdpSocket = require('./GlobalUdpSocket');

let singleton = null;

class Gamedig {
    constructor() {
        this.udpSocket = new GlobalUdpSocket();
        this.queryRunner = new QueryRunner(this.udpSocket);
        this._debug = false;
    }

    setDebug(on) {
        this.udpSocket.debug = on;
        this._debug = on;
        this.queryRunner.debug = on;
    }

    async query(userOptions) {
        userOptions.debug |= this._debug;
        return await this.queryRunner.run(userOptions);
    }

    static getInstance() {
        if (!singleton) {
            singleton = new Gamedig();
        }
        return singleton;
    }
    static query(userOptions, callback) {
        const promise = Gamedig.getInstance().query(userOptions);
        if (callback && callback instanceof Function) {
            if (callback.length === 2) {
                promise
                    .then((state) => callback(null, state))
                    .catch((error) => callback(error));
            } else if (callback.length === 1) {
                promise
                    .then((state) => callback(state))
                    .catch((error) => callback({error: error}));
            }
        }
        return promise;
    }
}
Object.defineProperty(Gamedig, "debug", { set: on => Gamedig.getInstance().setDebug(on) });

module.exports = Gamedig;
