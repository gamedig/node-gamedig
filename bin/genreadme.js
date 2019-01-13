#!/usr/bin/env node

const fs = require('fs'),
    GameResolver = require('../lib/GameResolver'),
    gameResolver = new GameResolver();

const generated = gameResolver.printReadme();

const readmeFilename = __dirname+'/../README.md';
const readme = fs.readFileSync(readmeFilename, {encoding:'utf8'});

const marker_top = '<!--- BEGIN GENERATED GAMES -->';
const marker_bottom = '<!--- END GENERATED GAMES -->';

let start = readme.indexOf(marker_top);
start += marker_top.length;
const end = readme.indexOf(marker_bottom);

const updated = readme.substr(0,start)+"\n\n"+generated+"\n"+readme.substr(end);
fs.writeFileSync(readmeFilename, updated);
