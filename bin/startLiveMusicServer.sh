#!/bin/bash
# Start a demo live music server and query against it.

SERVER="../node_modules/ldf-server/bin/ldf-server"

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"

export SERVER=$SERVER
export TARGET="http://localhost:3000/radio" # ldf endpoint
export INTERVAL=true
export CACHING=true
export DEBUG=true
export WORKERS=1

# ---- Don't change anything below this ----

echo "Running format $TYPE"
echo ""

node generate $TYPE > config.json
$SERVER config.json &
pid=$!
sleep 1

echo "Executing continuous query..."
echo ""
echo ""

node query $TYPE
kill -9 $pid
