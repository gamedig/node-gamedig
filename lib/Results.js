class Player {
    constructor(data) {
        this.name = '';
        this.raw = {};

        if (typeof data === 'string') {
            this.name = data;
        } else {
            const {name, ...raw} = data;
            if (name) this.name = name;
            if (raw) this.raw = raw;
        }
    }
}

class Players extends Array {
    setNum(num) {
        // If the server specified some ridiculous number of players (billions), we don't want to
        // run out of ram allocating these objects.
        num = Math.min(num, 10000);

        while(this.length < num) {
            this.push({});
        }
    }

    push(data) {
        super.push(new Player(data));
    }
}

class Results {
    constructor() {
        this.name = '';
        this.map = '';
        this.password = false;

        this.raw = {};

        this.maxplayers = 0;

        Object.defineProperties(this, {
            _players: {writable: true, enumerable: false},
            players: {
                get: () => { return this._players; },
                set: (val) => {
                    if (Array.isArray(val)) {
                        this._players = val;
                    } else {
                        this._players.setNum(val);
                    }
                },
                enumerable: true
            },
            _bots: {writable: true, enumerable: false},
            bots: {
                get: () => { return this._bots; },
                set: (val) => {
                    if (Array.isArray(val)) {
                        this._bots = val;
                    } else {
                        this._bots.setNum(val);
                    }
                },
                enumerable: true
            }
        });

        this.players = new Players();
        this.bots = new Players();
    }
}

module.exports = Results;
