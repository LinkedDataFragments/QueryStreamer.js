#!/bin/bash
# Run the train tests for measuring execution times for all possibilities.
# This will also trigger plots to be created.

# Locations of ldf-server/client
if [ -z "$SERVER" ]; then
    SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
fi
if [ -z "$CLIENTDIR" ]; then
    CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"
fi
if [ -z "$DATAREPLAYDIR" ]; then
    DATAREPLAYDIR="/Users/kroeser/schooljaar/Thesis/data-replay/"
fi
if [ -z "$DATAREPLAYCONFIG" ]; then
    DATAREPLAYCONFIG="/Users/kroeser/schooljaar/Thesis/time-annotated-query/test/tests/data/train-replay-local.json"
fi

# Test parameters.
RUNS=10 # The amount of times all tests should be ran to average over.
TESTTIME=60 # seconds each test should take
UPDATEFREQUENCY=10 # seconds between each data update server-side
TESTEXECUTIONS=10 # amount of naieve tests per frequency
TARGET="http://localhost:3001/train" # ldf endpoint
DATAREPLAYSPEED="*60"

# TMP
#RUNS=1
#TESTTIME=20
#UPDATEFREQUENCY=1
#TESTEXECUTIONS=1

# ---- Don't change anything below this line ----

mkdir -p output
export UPDATEFREQUENCY=$UPDATEFREQUENCY
export TARGET=$TARGET
export SERVER=$SERVER
export CLIENTDIR=$CLIENTDIR

function testSetup {
  $DATAREPLAYDIR"bin/data-replay" $DATAREPLAYSPEED $DATAREPLAYCONFIG > /dev/null &
  replaypid=$!

  node ../bin/live-ldf-server ../bin/config_train.json > /dev/null 2>&1 &
  pid=$!
  sleep 5

  ./proxy.sh $fileProxyBins &
  proxypid=$!
}

function testBreakdown {
  kill -9 $pidq > /dev/null 2>&1
  ./proxy.sh stop $proxypid
  kill -9 $pid > /dev/null 2>&1
  kill -9 $replaypid > /dev/null 2>&1
}

dirs=""
for i in $(seq $RUNS); do
  dir="test"$(date +%s)
  dirs=$dir" "$dirs
  mkdir output/$dir

  # TA tests
  for TYPE in reification singletonproperties graphs implicitgraphs; do
    for INTERVAL in true false; do
      for CACHING in true false; do
        export TYPE=$TYPE
        export INTERVAL=$INTERVAL
        export CACHING=$CACHING

        file="output/$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
        fileProxyBins="output/$dir/annotation-proxyBins-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".json"

        echo "Format:    $TYPE"
        echo "Intervals: $INTERVAL"
        echo "Caching:   $CACHING"
        echo "File:      $file"
        echo "----------"

        testSetup

        node ../bin/querytrain $TYPE > $file 2>/dev/null &
        pidq=$!
        sleep $TESTTIME

        testBreakdown
      done
    done
  done

  # Naieve tests
  export TYPE="none" # no time annotation
  export INTERVAL=false # overwite last triples
  for UPDATEFREQUENCY in $(seq 250 250 20000); do
    export UPDATEFREQUENCY=$UPDATEFREQUENCY
    file="output/$dir/naieve-"$UPDATEFREQUENCY".txt"
    fileProxyBins="output/$dir/naieve-proxyBins-"$UPDATEFREQUENCY".json"

    echo "File:      $file"
    echo "----------"

    testSetup

    node ../bin/querytrainnaieve $TYPE > $file 2>/dev/null &
    pidq=$!
    TESTTIME=$(echo "scale=4;$TESTEXECUTIONS * $UPDATEFREQUENCY / 1000" | bc -l)
    sleep $TESTTIME

    testBreakdown
  done
done

./plotTrainTests.sh $dirs
./plotTrainTestsRewriting.sh $dirs
