#!/usr/bin/env node

const fs = require('fs'),
    games = require('../games.json');

const parsed = games.map(game => {
  if (!game.name) return;
  let notes = '';
  if (game.extra && game.extra.docNotes) notes = ` [[Additional Notes](#${game.extra.docNotes})]`;

  return `* ${game.name} (${game.id})${notes}\n`
});
const generated = `${parsed.join('')}`

const readmeFilename = __dirname+'/../README.md';
const readme = fs.readFileSync(readmeFilename, {encoding:'utf8'});

const marker_top = '<!--- BEGIN GENERATED GAMES -->';
const marker_bottom = '<!--- END GENERATED GAMES -->';

let start = readme.indexOf(marker_top);
start += marker_top.length;
const end = readme.indexOf(marker_bottom);

const updated = readme.substr(0,start)+"\n\n"+generated+"\n"+readme.substr(end);
fs.writeFileSync(readmeFilename, updated);
