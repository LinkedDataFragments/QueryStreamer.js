#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"

export TARGET="http://localhost:3000/radio" # ldf endpoint
export INTERVAL=true
export CACHING=false
export DEBUG=true

echo "Running format $TYPE"
echo ""

node generate $TYPE > config.json
$SERVER config.json &
pid=$!
sleep 1

echo "Executing continuous query..."
echo ""
echo ""

export CLIENTDIR=$CLIENTDIR
node query $TYPE
kill -9 $pid
