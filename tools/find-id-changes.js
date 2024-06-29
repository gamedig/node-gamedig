#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import assert from 'node:assert'
import { mkdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// Generate a list of changes to "lib/games.js" where game IDs have been changed via the git history.
// Requires git to be installed.
// Make sure you don't have any local un-committed changes to lib/games.js

// Usage: node tools/find-id-changes.js > id-changes.json
// Output is an array of
// {
//   "hash":    "git commit hash",
//   "changes": [ ["oldid", "newid"], ... ],
//   "removed": [ "removedid", ... ],
//   "added":   [ "addedid", ... ]
// }

// The output can be converted to a map of { "oldid": "newid" } using a jq command:
// cat id-changes.json | jq ".[].changes | map({ (.[0]): .[1] } ) | add" | jq -s "add"

const main = async (rootDir) => {
  // Make sure CWD is the root of the repo
  process.chdir(rootDir)

  // Get list of commits that have modified lib/games.js
  const gitLog = spawnSync(
    'git',
    [
      'log',
      '--follow',
      '--format=%H',
      '--diff-filter=M',
      '--reverse',
      '--',
      'lib/games.js'
    ],
    { encoding: 'utf-8' }
  )

  // Make a directory to store files in
  mkdirSync('game_changes', { recursive: true })

  const output = []

  for (const commitHash of gitLog.stdout.split('\n')) {
    if (commitHash.length === 0) continue

    // Checkout lib/games.js before the commit that changed it
    assert(
      spawnSync('git', ['checkout', `${commitHash}^1`, '--', 'lib/games.js'])
        .status === 0
    )

    // We have to copy each state of the file to its own file because node caches imports
    const beforeName = `game_changes/${commitHash}-before.js`
    copyFileSync('lib/games.js', beforeName)

    const before = await import(path.join('../', beforeName))

    // Checkout lib/games.js after the commit that changed it
    assert(
      spawnSync('git', ['checkout', `${commitHash}`, '--', 'lib/games.js'])
        .status === 0
    )

    const afterName = `game_changes/${commitHash}-after.js`
    copyFileSync('lib/games.js', afterName)

    const after = await import(path.join('../', afterName))

    // Find game IDs that were removed and added
    let removed = Object.keys(before.games).filter(
      (key) => !(key in after.games)
    )
    let added = Object.keys(after.games).filter(
      (key) => !(key in before.games)
    )

    const changes = []

    for (const rm of removed) {
      for (const add of added) {
        const beforeGame = before.games[rm]
        const afterGame = after.games[add]

        // Modify game names to ignore case, spaces, and punctuation
        const beforeName = beforeGame.name.toLowerCase().replace(/[^a-z]/g, '')
        const afterName = afterGame.name.toLowerCase().replace(/[^a-z]/g, '')

        if (
          beforeGame.options.protocol === afterGame.options.protocol &&
          (beforeName.includes(afterName) || afterName.includes(beforeName))
        ) {
          changes.push([rm, add])
          removed = removed.filter((r) => r !== rm)
          added = added.filter((a) => a !== add)
          break
        }
      }
    }

    output.push({
      hash: commitHash,
      changes,
      removed,
      added
    })
  }

  // Reset the contents of lib/games.js
  spawnSync('git', ['checkout', '--', 'lib/games.js'])

  return output
}

main(
  // Get the root of the repo:
  // dir of bin/find-id-changes.js -> /../
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
).then((o) => console.log(JSON.stringify(o)), console.error)
