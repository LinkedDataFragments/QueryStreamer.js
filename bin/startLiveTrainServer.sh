#!/bin/bash
# Start a demo live train server and query against it.

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"
datareplay="/Users/kroeser/schooljaar/Thesis/data-replay/bin/data-replay"
REPLAYCONFIG="/Users/kroeser/schooljaar/Thesis/time-annotated-query/test/tests/data/train-replay-local.json"
DEBUG=true
if $DEBUG; then export DEBUG=true; fi

# Set the triple formatting type.
TYPE="reification"
#TYPE="singletonproperties"
#TYPE="graphs"
#TYPE="implicitgraphs"

INTERVAL=false

CACHING=false

export TYPE=$TYPE
export SERVER=$SERVER
export CLIENTDIR=$CLIENTDIR
export INTERVAL=$INTERVAL
export CACHING=$CACHING
export UPDATEFREQUENCY=10
export TARGET="http://localhost:3001/train" # ldf endpoint

if $DEBUG; then
  echo "Format: $TYPE"
  echo "Intervals: $INTERVAL"
  echo "Caching: $CACHING"
  echo ""
fi

$datareplay *60 $REPLAYCONFIG > /dev/null &
replaypid=$!

../measurement/http-proxy &

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

node querytrain $TYPE &
sleep 60
wget http://localhost:3001/train/closeProxy > /dev/null 2>&1
sleep 2
kill -9 $!
kill -9 $pid
kill -9 $replaypid
