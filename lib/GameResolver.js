const Path = require('path'),
    fs = require('fs');

class GameResolver {
    constructor() {
        this.games = this._readGames();
    }

    lookup(type) {
        if(!type) throw Error('No game specified');

        if(type.substr(0,9) === 'protocol-') {
            return {
                protocol: type.substr(9)
            };
        }

        const game = this.games.get(type);
        if(!game) throw Error('Invalid game: '+type);
        return game.options;
    }

    printReadme() {
        let out = '';
        for(const key of Object.keys(games)) {
            const game = games[key];
            if (!game.pretty) {
                continue;
            }
            out += "* "+game.pretty+" ("+key+")";
            if(game.options.port_query_offset || game.options.port_query)
                out += " [[Separate Query Port](#separate-query-port)]";
            if(game.extra.doc_notes)
                out += " [[Additional Notes](#"+game.extra.doc_notes+")]";
            out += "\n";
        }
        return out;
    }

    _readGames() {
        const gamesFile = Path.normalize(__dirname+'/../games.txt');
        const lines = fs.readFileSync(gamesFile,'utf8').split('\n');
        const games = new Map();

        for (let line of lines) {
            // strip comments
            const comment = line.indexOf('#');
            if(comment !== -1) line = line.substr(0,comment);
            line = line.trim();
            if(!line) continue;

            const split = line.split('|');
            const gameId = split[0].trim();
            const options = this._parseList(split[3]);
            options.protocol = split[2].trim();

            games.set(gameId, {
                pretty: split[1].trim(),
                options: options,
                extra: this._parseList(split[4])
            });
        }
        return games;
    }

    _parseList(str) {
        if(!str) return {};
        const out = {};
        for (const one of str.split(',')) {
            const equals = one.indexOf('=');
            const key = equals === -1 ? one : one.substr(0,equals);
            let value = equals === -1 ? '' : one.substr(equals+1);

            if(value === 'true' || value === '') value = true;
            else if(value === 'false') value = false;
            else if(!isNaN(parseInt(value))) value = parseInt(value);

            out[key] = value;
        }
        return out;
    }
}

module.exports = GameResolver;
