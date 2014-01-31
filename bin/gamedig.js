#!/usr/bin/env node

var argv = require('optimist').argv;

var debug = argv.debug;
delete argv.debug;

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
		console.log(state);
	}
);
