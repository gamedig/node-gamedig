# GameDig Development Tools
Small scripts for maintainers and debugging. Run them from the **repository root** unless noted.


## attempt_protocols.js
Tries every built-in protocol (except a few master/chat-only types) against a server until one succeeds. Stops on the first successful query and prints the response; otherwise prints errors per protocol.

- **`<host[:port]>`** — Target server. Port is optional if your default is fine for the protocol.
- **`debug`** — Optional second argument; enables GameDig debug when present.

```sh
node tools/attempt_protocols.js <host[:port]> [debug]
```


## esbuild.js
Builds the CommonJS bundle for npm (`dist/index.cjs`). Equivalent to `node tools/esbuild.js`. Used by `prepare` after install.

```sh
npm run build
```


## find_id_duplicates.js
Checks `lib/games.js` for duplicate game type IDs, including IDs listed in `extra.old_id`. Exits after printing either duplicate IDs or “No duplicates found.”

```sh
node tools/find_id_duplicates.js
```


## run-id-tests.js
Runs the **`gamedig-id-tests`** helper with the contents of `lib/games.js` as JSON on stdin; exit code and output are from that program. Install the binary from [rust-gamedig](https://github.com/gamedig/rust-gamedig) (for example `cargo install --git https://github.com/gamedig/rust-gamedig.git gamedig-id-tests`) and ensure it is on `PATH`, or set **`GAMEDIG_ID_TESTER`** to another executable.

```sh
node tools/run-id-tests.js
```


## find-id-changes.js
Uses **git** to list how game IDs in `lib/games.js` changed across commits (renames, additions, removals). Temporarily checks out old versions of `lib/games.js`, writes snapshots under `game_changes/`, then restores `lib/games.js` to the current branch state.

**Requirements**

- Git available on `PATH`
- **No uncommitted changes** to `lib/games.js` (avoid mixing local edits with history)

```sh
node tools/find-id-changes.js > id-changes.json
```

Output is a JSON array of objects with `hash`, `changes` (pairs of `[oldId, newId]`), `removed`, and `added`. To fold changes into a single old→new map with [jq](https://jqlang.github.io/jq/):

```sh
cat id-changes.json | jq '.[].changes | map({ (.[0]): .[1] }) | add' | jq -s add
```


## generate_games_list.js
Regenerates the games table in **`GAMES_LIST.md`** between the markers below. Run this after editing `lib/games.js` so the published list stays in sync.

`<!--- BEGIN GENERATED GAMES -->` … `<!--- END GENERATED GAMES -->`

```sh
node tools/generate_games_list.js
```
