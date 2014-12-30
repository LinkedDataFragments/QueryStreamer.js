#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"
DEBUG=true
if $DEBUG; then export DEBUG=true; fi

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"

export TYPE=$TYPE
export SERVER=$SERVER
export CLIENTDIR=$CLIENTDIR

if $DEBUG; then
  echo "Running format $TYPE"
  echo ""
fi

if $DEBUG; then
  node live-ldf-server config_train.json &
else
  node live-ldf-server config_train.json > /dev/null &
fi
pid=$!
sleep 5

if $DEBUG; then
  echo "Executing continuous query..."
  echo ""
  echo ""
fi

node querytrain $TYPE
kill -9 $pid
