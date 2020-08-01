const QueryRunner = require('./QueryRunner');

class Gamedig {
    constructor() {
        this.queryRunner = new QueryRunner();
    }
    async query(userOptions) {
        return await this.queryRunner.run(userOptions);
    }
}

const gameDig = new Gamedig();
Object.freeze(gameDig);
module.exports = gameDig;
