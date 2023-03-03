#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import GameResolver from "../src/utils/GameResolver";
const gameResolver = new GameResolver();

const generated = gameResolver.printReadme();

const readmeFilename = __dirname + "/../README.md";
const readme = readFileSync(readmeFilename, { encoding: "utf8" });

const marker_top = "<!--- BEGIN GENERATED GAMES -->";
const marker_bottom = "<!--- END GENERATED GAMES -->";

let start = readme.indexOf(marker_top);
start += marker_top.length;
const end = readme.indexOf(marker_bottom);

const updated =
  readme.substr(0, start) + "\n\n" + generated + "\n" + readme.substr(end);
writeFileSync(readmeFilename, updated);
