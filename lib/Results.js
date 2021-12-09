class Player {
    name = '';
    raw = {};

    constructor(data) {
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
    name = '';
    map = '';
    password = false;

    raw = {};

    maxplayers = 0;
    players = new Players();
    bots = new Players();

    set players(val) {
        if (typeof val === 'number') {
            this.players.setNum(val);
        } else if (Array.isArray(val)) {
            this.players = val;
        }
    }
    set bots(val) {
        if (typeof val === 'number') {
            this.bots.setNum(val);
        } else if (Array.isArray(val)) {
            this.bots = val;
        }
    }
}

module.exports = Results;
