const Path = require('path'),
    fs = require('fs');

class GameResolver {
    constructor() {
        const loaded = this._readGames();
        this.gamesByKey = loaded.gamesByKey;
        this.games = loaded.games;
    }

    lookup(type) {
        if(!type) throw Error('No game specified');

        if(type.substr(0,9) === 'protocol-') {
            return {
                protocol: type.substr(9)
            };
        }

        const game = this.gamesByKey.get(type);
        if(!game) throw Error('Invalid game: '+type);
        return game.options;
    }

    printReadme() {
        let out = '';
        out += '| GameDig Type ID | Name | See Also\n';
        out += '|---|---|---\n';

        const sorted = this.games
            .filter(game => game.pretty)
            .sort((a,b) => {
                return a.pretty.localeCompare(b.pretty);
            });
        for(const game of sorted) {
            let keysOut = game.keys.map(key => '`'+key+'`').join('<br>');
            out += "| " + keysOut.padEnd(10, " ") + " "
                + "| " + game.pretty;
            let notes = [];
            if(game.extra.doc_notes) {
                notes.push("[Notes](#" + game.extra.doc_notes + ")");
            }
            if(game.options.protocol === 'valve') {
                notes.push('[Valve Protocol](#valve)');
            }
            if(notes.length) {
                out += " | " + notes.join(', ');
            }
            out += "\n";
        }
        return out;
    }

    _readGames() {
        const gamesFile = Path.normalize(__dirname+'/../games.txt');
        const lines = fs.readFileSync(gamesFile,'utf8').split('\n');

        const gamesByKey = new Map();
        const games = [];

        for (let line of lines) {
            // strip comments
            const comment = line.indexOf('#');
            if(comment !== -1) line = line.substr(0,comment);
            line = line.trim();
            if(!line) continue;

            const split = line.split('|');
            const keys = split[0].trim().split(',');
            const name = split[1].trim();
            const options = this._parseList(split[3]);
            options.protocol = split[2].trim();
            const extra = this._parseList(split[4]);

            const game = {
                keys: keys,
                pretty: name,
                options: options,
                extra: extra
            };

            for (const key of keys) {
                gamesByKey.set(key, game);
            }
            games.push(game);
        }
        return { gamesByKey, games };
    }

    _parseList(str) {
        if(!str) return {};
        const out = {};
        for (const one of str.split(',')) {
            const equals = one.indexOf('=');
            const key = equals === -1 ? one : one.substr(0,equals);

            /** @type {string|number|boolean} */
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
