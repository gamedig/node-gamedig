#!/usr/bin/env node

var fs = require('fs');

var TypeResolver = require('../lib/typeresolver');
var generated = TypeResolver.printReadme();

var readmeFilename = __dirname+'/../README.md';
var readme = fs.readFileSync(readmeFilename, {encoding:'utf8'});

var marker_top = '<!--- BEGIN GENERATED GAMES -->';
var marker_bottom = '<!--- END GENERATED GAMES -->';

var start = readme.indexOf(marker_top);
start += marker_top.length;
while(readme.charAt(start) == "\n" || readme.charAt(start) == "\r") { start++; }

var end = readme.indexOf(marker_bottom);

var updated = readme.substr(0,start)+generated+readme.substr(end);
fs.writeFileSync(readmeFilename, updated);
