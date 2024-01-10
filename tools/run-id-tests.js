import { spawnSync } from 'node:child_process';
import process from 'node:process';

import { games } from './../lib/index.js';

const ID_TEST_BIN = process.env["GAMEDIG_ID_TESTER"] || "gamedig-id-tests";

const result = spawnSync(ID_TEST_BIN, {
    input: JSON.stringify(games),
    stdio: ['pipe', 'inherit', 'inherit'],
});

if (result.error) {
    throw result.error;
}

process.exit(result.status);