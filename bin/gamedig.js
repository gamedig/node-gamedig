#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2)),
    Gamedig = require('..');

const debug = argv.debug;
delete argv.debug;
const outputFormat = argv.output;
delete argv.output;

const options = {};
for(const key of Object.keys(argv)) {
    const value = argv[key];
    if(
        key === '_'
        || key.charAt(0) === '$'
        || (typeof value !== 'string' && typeof value !== 'number')
    )
        continue;
    options[key] = value;
}

if(debug) Gamedig.debug = true;
Gamedig.isCommandLine = true;

Gamedig.query(options)
    .then((state) => {
        if(outputFormat === 'pretty') {
            console.log(JSON.stringify(state,null,'  '));
        } else {
            console.log(JSON.stringify(state));
        }
    })
    .catch((error) => {
        if (debug) {
            if (error instanceof Error) {
                console.log(error.stack);
            } else {
                console.log(error);
            }
        } else {
            if (error instanceof Error) {
                error = error.message;
            }
            if (outputFormat === 'pretty') {
                console.log(JSON.stringify({error: error}, null, '  '));
            } else {
                console.log(JSON.stringify({error: error}));
            }
        }
    });
