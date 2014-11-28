#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"

echo "Running format $TYPE"
echo ""

export TYPE=$TYPE
node live-ldf-server config_train.json &
pid=$!
sleep 5

echo "Executing continuous query..."
echo ""
echo ""

export CLIENTDIR=$CLIENTDIR
node querytrain $TYPE
kill -9 $pid
