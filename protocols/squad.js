const Valve = require('./valve');

class Squad extends Valve {
    constructor() {
        super();
    }

    async cleanup(state) {
        await super.cleanup(state);
        if (state.raw.rules != null && state.raw.rules.Password_b === "true") {
            state.password = true;
        }
    }
}

module.exports = Squad;
