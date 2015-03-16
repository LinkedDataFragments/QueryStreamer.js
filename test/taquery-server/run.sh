#!/bin/bash
# Run the train tests for measuring execution times for all possibilities.
# This will also trigger plots to be created.

# Locations of ldf-server/client
DURATION=$(echo "10 + $2" | bc -l)
if [ -z "$LDFSERVER" ]; then
    LDFSERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
fi
if [ -z "$SERVER" ]; then
    SERVER="127.0.0.1"
fi
if [ -z "$TADIR" ]; then
    TADIR="/Users/kroeser/schooljaar/Thesis/time-annotated-query/bin/"
fi
if [ -z "$DATAREPLAYDIR" ]; then
    DATAREPLAYDIR="/Users/kroeser/schooljaar/Thesis/data-replay/"
fi
if [ -z "$DATAREPLAYCONFIG" ]; then
    DATAREPLAYCONFIG="/Users/kroeser/schooljaar/Thesis/time-annotated-query/test/tests/data/train-replay-local.json"
fi
HTTPBARRIERSERVERPORT=3010
CLIENTS=$1
if [ -z "$HTTPBARRIERDIR" ]; then
    HTTPBARRIERDIR="/Users/kroeser/schooljaar/Thesis/http-barrier/"
fi

# Test parameters.
UPDATEFREQUENCY=10 # seconds between each data update server-side
DATAREPLAYSPEED="*1"
TARGET="http///$SERVER:3000/train"

# ---- Don't change anything below this line ----

mkdir -p output
export UPDATEFREQUENCY=$UPDATEFREQUENCY
export TARGET=$TARGET
export SERVER=$LDFSERVER

export INTERVAL=false
export CACHING=false
export TYPE="graphs"

function testSetup {
  $DATAREPLAYDIR"bin/data-replay" $DATAREPLAYSPEED $DATAREPLAYCONFIG > /dev/null &
  replaypid=$!

  node $TADIR/live-ldf-server $TADIR/config_train.json > /var/tmp/server-debug.log 2>&1 &
  pid=$!
  sleep 5
}

function testBreakdown {
  kill -9 $pid > /dev/null 2>&1
  kill -9 $replaypid > /dev/null 2>&1
}

testSetup

# Wait for all clients to signal test start at exactly the same moment.
$HTTPBARRIERDIR"bin/http-barrier-server" $CLIENTS $HTTPBARRIERSERVERPORT
echo "Clients are up, initiate server measurements."

# Start measurements.
mkdir -p output
./measure_top.sh $pid > output/run-$3.txt &
mpid=$!

# Sleep for the test duration
sleep $DURATION

testBreakdown
