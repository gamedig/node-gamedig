#!/usr/bin/env node

var argv = require('optimist').argv;

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
Gamedig.query(
	options,
	function(state) {
		if(outputFormat == 'pretty') {
			console.log(JSON.stringify(state,null,'  '));
		} else {
			console.log(JSON.stringify(state));
		}
	}
);
