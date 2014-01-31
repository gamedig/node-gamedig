var Path = require('path'),
	fs = require('fs');

var gamesDir = Path.normalize(__dirname+'/../games');

function readAliases() {
	var lines = fs.readFileSync(gamesDir+'/aliases.txt','utf8').split('\n');
	var aliases = {};

	lines.forEach(function(line) {
		line = line.trim();
		if(!line) return;
		if(line.charAt(0) == '#') return;
		var split = line.split('|');

		aliases[split[0].trim()] = {
			pretty: split[1].trim(),
			protocol: split[2].trim(),
			port: split[3] ? parseInt(split[3]) : 0
		};
	});
	return aliases;
}
var aliases = readAliases();

function createQueryInstance(type) {
	type = Path.basename(type);

	var path = gamesDir+'/'+type;
	if(type.substr(0,9) == 'protocol-') {
		path = gamesDir+'/protocols/'+type.substr(9);
	}

	if(!fs.existsSync(path+'.js')) return false;
	var protocol = require(path);

	return new protocol();
}

module.exports = function(type) {
	var alias = aliases[type];

	if(alias) {
		var query = createQueryInstance('protocol-'+alias.protocol);
		if(!query) return false;
		query.pretty = alias.pretty;
		if(alias.port) query.options.port = alias.port;
		return query;
	}
	return createQueryInstance(type);
}
