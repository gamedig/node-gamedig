#!/usr/bin/env node

import * as fs from 'fs';
import GameResolver from "../lib/GameResolver";

const gameResolver = new GameResolver();

const generated = gameResolver.printReadme();

const readmeFilename = __dirname+'/../README.md';
const readme = fs.readFileSync(readmeFilename, {encoding:'utf8'});

const marker_top = '<!--- BEGIN GENERATED GAMES -->';
const marker_bottom = '<!--- END GENERATED GAMES -->';

let start = readme.indexOf(marker_top);
start += marker_top.length;
const end = readme.indexOf(marker_bottom);

const updated = readme.substring(0,start)+"\n\n"+generated+"\n"+readme.substring(end);
fs.writeFileSync(readmeFilename, updated);
