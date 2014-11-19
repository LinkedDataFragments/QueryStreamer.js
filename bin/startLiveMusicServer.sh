#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"

# Set the triple formatting type.
TYPE="reification"
#TYPE="singletonproperties"
#TYPE="graphs"

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
