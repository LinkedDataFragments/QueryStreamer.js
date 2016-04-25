#!/bin/bash
# Start a demo live train server and query against it.

SERVER="../node_modules/ldf-server/bin/ldf-server"
datareplay="../node_modules/data-record/bin/data-replay"
REPLAYCONFIG="../data/train-replay-local.json"
DEBUG=true

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"
#TYPE="implicitgraphs"

INTERVAL=false
CACHING=true

# ---- Don't change anything below this ----

if $DEBUG; then export DEBUG=true; fi

export TYPE=$TYPE
export SERVER=$SERVER
export CLIENTDIR=$CLIENTDIR
export INTERVAL=$INTERVAL
export CACHING=$CACHING
export UPDATEFREQUENCY=10
export TARGET="http://localhost:3002/train" # ldf endpoint
export WORKERS=1

if $DEBUG; then
  echo "Format: $TYPE"
  echo "Intervals: $INTERVAL"
  echo "Caching: $CACHING"
  echo ""
fi

# Unpack the replay data
if [ ! -d "../data/raw" ]; then
  mkdir ../data/raw
  unzip ../data/data_6_12_2014.zip -d ../data/raw/
fi

# Start replaying data
$datareplay *60 $REPLAYCONFIG > /dev/null &
replaypid=$!

# Start the proxy between our client and server
./http-proxy &

# Setup the LDF server with updating data
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

# Start the dynamic query
node querytrain $TYPE &

# Stop after 60 seconds
sleep 60
wget http://localhost:3002/train/closeProxy > /dev/null 2>&1
sleep 2
kill -9 $!
kill -9 $pid
kill -9 $replaypid
