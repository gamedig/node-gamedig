const QueryRunner = require('./QueryRunner');

let singleton = null;

class Gamedig {
    constructor() {
        this.queryRunner = new QueryRunner();
    }

    async query(userOptions) {
        return await this.queryRunner.run(userOptions);
    }

    static getInstance() {
        if (!singleton) singleton = new Gamedig();
        return singleton;
    }
    static async query(...args) {
        return await Gamedig.getInstance().query(...args);
    }
}

module.exports = Gamedig;
