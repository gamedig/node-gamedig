#!/bin/bash
PORTPARAM=""
if [[ "$#" > 2 ]]; then
 PORTPARAM=$(printf -- "--port %q" "$3")
fi
bin/gamedig.js --output pretty --debug --type "$1" --host "$2" $PORTPARAM
