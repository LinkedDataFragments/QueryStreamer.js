#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"
DEBUG=true
if $DEBUG; then export DEBUG=true; fi

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"
#TYPE="implicitgraphs"

INTERVAL=false

CACHING=true

export TYPE=$TYPE
export SERVER=$SERVER
export CLIENTDIR=$CLIENTDIR
export INTERVAL=$INTERVAL
export CACHING=$CACHING

if $DEBUG; then
  echo "Format: $TYPE"
  echo "Intervals: $INTERVAL"
  echo "Caching: $CACHING"
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
