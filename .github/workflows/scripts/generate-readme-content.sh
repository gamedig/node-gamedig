#!/bin/bash

readmeFilename="$PWD/../README.md"
readme=$(cat $readmeFilename)

marker_top="<!--- BEGIN GENERATED GAMES -->"
marker_bottom="<!--- END GENERATED GAMES -->"

start=$(echo "$readme" | grep -n "$marker_top" | cut -d: -f1)
let "start+=${#marker_top}"
end=$(echo "$readme" | grep -n "$marker_bottom" | cut -d: -f1)
let "end-=1"

generated="$(cat ../../src/utils/GameResolver.js | grep -o 'printReadme() {\s*return \(.*\);' | sed 's/printReadme() {\s*return \(.*\);/\1/' | sed 's/\\n/\n/g')"

updated=$(echo -e "${readme:0:$start}\n\n${generated}\n${readme:$end}")

echo -e "$updated" >$readmeFilename
