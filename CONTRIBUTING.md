# Contributing to node-GameDig
This project is very open to new suggestions, additions and/or changes, these
can come in the form of *discussions* about the project's state, *proposing a
new feature*, *holding a few points on why we shall do X breaking change* or
*submitting a fix*.

## Communications
GitHub is the place we use to track bugs and discuss new features/changes,
although we have a [Discord](https://discord.gg/NVCMn3tnxH) server for the
community, all bugs, suggestions and changes will be reported on GitHub
alongside with their backing points to ensure the transparency of the project's
development.

## Issues
Before opening an issue, check if there is an existing relevant issue first,
someone might just have had your issue already, or you might find something
related that could be of help.

When opening a new issue, make sure to fill the issue template. They are made
to make the subject to be as understandable as possible, not doing so may result
in your issue not being managed right away, if you don't understand something
(be it regarding your own problem/the issue template/the library), please state
so.

## Development
Note before contributing that everything done here is under the [MIT](https://opensource.org/license/mit/) license.

### Naming
Naming is an important matter, and it shouldn't be changed unless necessary.

Game **names** should be added as they appear on steam (or other storefront
if not listed there) with also the release year included as `games.release_year`. 
If there is a mod that needs to be added (or it adds the support for server
queries for the game), its name should be composed of the game name, a separating
**bracket**, the mod name and the release year as specified previously
(e.g. `Grand Theft Auto V - FiveM`).

A game's **identification** is a unique lowercase alphanumeric string will and be forged
following these rules:

1. Names composed of a maximum of two words (unless #4 applies) will result in an
   id where the words are concatenated (`Dead Cells` -> `deadcells`), acronyms in
   the name count as a single word (`S.T.A.L.K.E.R.` -> `stalker`).
2. Names of more than two words shall be made into an acronym made of the
   initial letters (`The Binding of Isaac` -> `tboi`), [hypenation composed words](https://prowritingaid.com/hyphenated-words)
   don't count as a single word, but of how many parts they are made of
   (`Dino D-Day`, 3 words, so `ddd`).
3. If a game has the exact name as a previously existing id's game
   (`Star Wars Battlefront 2`, the 2005 and 2017 one), append the release year to
   the newer id (2005 would be `swb2` (suppose we already have this one supported)
   and 2017 would be `swb22017`).
4. If a new id (`Day of Dragons` -> `dod`) results in an id that already exists
   (`Day of Defeat` -> `dod`), then the new name should ignore rule #2
   (`Day of Dragons` -> `dayofdragons`).
5. Roman numbering will be converted to arabic numbering (`XIV` -> `14`).
6. Unless numbers (years included) are at the end of a name, they will be considered
   words. If a number is not in the first position, its entire numeric digits will be
   used instead of the acronym of that number's digits (`Left 4 Dead` -> `l4d`). If the
   number is in the first position the longhand (words: 5 -> five) representation of the
   number will be used to create an acronym (`7 Days to Die` -> `sdtd`). Other examples:
   `Team Fortress 2` -> `teamfortress2`, `Unreal Tournament 2003` ->
   `unrealtournament2003`.
7. If a game supports multiple protocols, multiple entries will be done for said game
   where the edition/protocol name (first disposable in this order) will be appended to
   the base game id's: `<game_id><protocol_id>` (where the protocol id will follow all
   rules except #2) (Minecraft is mainly divided by 2 editions, Java and Bedrock
   which will be `minecraftjava` and `minecraftbedrock` respectively, but it also has
   legacy versions, which use another protocol, an example would be the one for `1.6`,
   so the name would be `Legacy 1.6` which its id will be `legacy16`, resulting in the
   entry of `minecraftlegacy16`). One more entry can be added by the base name of the
   game, which queries in a group said supported protocols to make generic queries
   easier and disposable.
8. If its actually about a mod that adds the ability for queries to be performed,
   process only the mod name.

### Game Object Example

```js
terrariatshosck: {
   name: 'Terraria - TShock',
   release_year: 2011,
   options: {
      port: 7777,
      port_query_offset: 101,
      protocol: 'terraria'
   },
   extra: {
      old_id: 'terraria',
      doc_notes: 'terraria'
   }
}
```

### Priorities
Game suggestions will be prioritized by maintainers based on whether the game
uses a protocol already implemented in the library (games that use already
implemented protocols will be added first), except in the case where a
contribution is made with the protocol needed to implement the game.

The same goes for protocols, if 2 were to be requested, the one implemented in
the most games will be prioritized.

### Releases
Currently, there is no exact release schedule.  
We use following versioning: MAJOR.MINOR.PATCH  

Whereas:  
MAJOR: Brings incompatible API changes.  
MINOR: Adding functionality in a backward compatible manner.  
PATCH: Bug fixes, games support, docs, dependencies patches.
