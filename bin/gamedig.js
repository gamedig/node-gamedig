#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));

var debug = argv.debug;
delete argv.debug;
var outputFormat = argv.output;
delete argv.output;

var options = {};
for(var key in argv) {
	var value = argv[key];
	if(
		key == '_'
		|| key.charAt(0) == '$'
		|| (typeof value != 'string' && typeof value != 'number')
	)
		continue;
	options[key] = value;
}

var Gamedig = require('../lib/index');
if(debug) Gamedig.debug = true;
Gamedig.isCommandLine = true;

Gamedig.query(options)
	.then((state) => {
		if(outputFormat == 'pretty') {
			console.log(JSON.stringify(state,null,'  '));
		} else {
			console.log(JSON.stringify(state));
		}
	})
	.catch((error) => {
		if(outputFormat == 'pretty') {
			console.log(JSON.stringify({error:error},null,'  '));
		} else {
			console.log(JSON.stringify({error:error}));
		}
	});
