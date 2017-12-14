const Path = require('path'),
    fs = require('fs');

const protocolDir = Path.normalize(__dirname+'/../protocols');
const gamesFile = Path.normalize(__dirname+'/../games.txt');

function parseList(str) {
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
function readGames() {
    const lines = fs.readFileSync(gamesFile,'utf8').split('\n');
    const games = {};

    for (let line of lines) {
        // strip comments
        const comment = line.indexOf('#');
        if(comment !== -1) line = line.substr(0,comment);
        line = line.trim();
        if(!line) continue;

        const split = line.split('|');

        games[split[0].trim()] = {
            pretty: split[1].trim(),
            protocol: split[2].trim(),
            options: parseList(split[3]),
            params: parseList(split[4])
        };
    }
    return games;
}
const games = readGames();

function createProtocolInstance(type) {
    type = Path.basename(type);

    const path = protocolDir+'/'+type;
    if(!fs.existsSync(path+'.js')) throw Error('Protocol definition file missing: '+type);
    const protocol = require(path);

    return new protocol();
}

class TypeResolver {
    static lookup(type) {
        if(!type) throw Error('No game specified');

        if(type.substr(0,9) === 'protocol-') {
            return createProtocolInstance(type.substr(9));
        }

        const game = games[type];
        if(!game) throw Error('Invalid game: '+type);

        const query = createProtocolInstance(game.protocol);
        query.pretty = game.pretty;
        for(const key of Object.keys(game.options)) {
            query.options[key] = game.options[key];
        }
        for(const key of Object.keys(game.params)) {
            query[key] = game.params[key];
        }

        return query;
    }
    static printReadme() {
        let out = '';
        for(const key of Object.keys(games)) {
            const game = games[key];
            out += "* "+game.pretty+" ("+key+")";
            if(game.options.port_query_offset || game.options.port_query)
                out += " [[Separate Query Port](#separate-query-port)]";
            if(game.params.doc_notes)
                out += " [[Additional Notes](#"+game.params.doc_notes+")]";
            out += "\n";
        }
        return out;
    }
}

module.exports = TypeResolver;
