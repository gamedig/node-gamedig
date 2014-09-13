var Path = require('path'),
	fs = require('fs');

var protocolDir = Path.normalize(__dirname+'/../protocols');
var gamesFile = Path.normalize(__dirname+'/../games.txt');

function parseList(str) {
	if(!str) return {};
	var split = str.split(',');
	var out = {};
	split.forEach(function(one) {
		var equals = one.indexOf('=');
		var key = equals == -1 ? one : one.substr(0,equals);
		var value = equals == -1 ? '' : one.substr(equals+1);

		if(value === 'true' || value === '') value = true;
		else if(value === 'false') value = false;
		else if(!isNaN(value)) value = parseInt(value);

		out[key] = value;
	});
	return out;
}
function readGames() {
	var lines = fs.readFileSync(gamesFile,'utf8').split('\n');
	var games = {};

	lines.forEach(function(line) {
		// strip comments
		var comment = line.indexOf('#');
		if(comment != -1) line = line.substr(0,comment);
		line = line.trim();
		if(!line) return;

		var split = line.split('|');

		games[split[0].trim()] = {
			pretty: split[1].trim(),
			protocol: split[2].trim(),
			options: parseList(split[3]),
			params: parseList(split[4])
		};
	});
	return games;
}
var games = readGames();

function createProtocolInstance(type) {
	type = Path.basename(type);

	var path = protocolDir+'/'+type;
	if(!fs.existsSync(path+'.js')) throw Error('Protocol definition file missing: '+type);
	var protocol = require(path);

	return new protocol();
}

module.exports = {
	lookup: function(type) {
		if(!type) throw Error('No game specified');

		if(type.substr(0,9) == 'protocol-') {
			return createProtocolInstance(type.substr(9));
		}

		var game = games[type];
		if(!game) throw Error('Invalid game: '+type);

		var query = createProtocolInstance(game.protocol);
		query.pretty = game.pretty;
		for(var key in game.options)
			query.options[key] = game.options[key];
		for(var key in game.params)
			query[key] = game.params[key];

		return query;
	},
	printReadme: function() {
		for(var key in games) {
			var game = games[key];
			var out = "* "+game.pretty+" ("+key+")";
			if(game.options.port_query_offset || game.options.port_query)
				out += " [[Separate Query Port](#separate-query-port)]";
			if(game.params.doc_notes)
				out += " [[Additional Notes](#"+game.params.doc_notes+")]"
			console.log(out);
		}
	}
};
