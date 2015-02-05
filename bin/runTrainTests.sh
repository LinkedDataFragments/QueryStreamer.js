#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"

RUNS=10 # The amount of times all tests should be ran to average over.
TESTTIME=60 # seconds each test should take
export UPDATEFREQUENCY=10 # seconds between each data update server-side
TESTEXECUTIONS=10 # amount of naieve tests per frequency
export TARGET="http://localhost:3001/train" # ldf endpoint

# TMP
RUNS=1
TESTTIME=10
TESTEXECUTIONS=2

dirs=""
for i in $(seq $RUNS); do
  dir="test"$(date +%s)
  dirs=$dir" "$dirs
  mkdir $dir

  # TA tests
  for TYPE in reification singletonproperties graphs implicitgraphs; do
    for INTERVAL in true false; do
      for CACHING in true false; do
        export TYPE=$TYPE
        export SERVER=$SERVER
        export CLIENTDIR=$CLIENTDIR
        export INTERVAL=$INTERVAL
        export CACHING=$CACHING

        file="$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"
        fileProxyBins="$dir/annotation-proxyBins-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".json"

        echo "Format:    $TYPE"
        echo "Intervals: $INTERVAL"
        echo "Caching:   $CACHING"
        echo "File:      $file"
        echo "----------"

        node live-ldf-server config_train.json > /dev/null 2>&1 &
        pid=$!
        sleep 5

        ./proxy.sh $fileProxyBins &
        proxypid=$!
        node querytrain $TYPE > $file 2>/dev/null &
        pidq=$!
        sleep $TESTTIME

        ./proxy.sh stop $proxypid
        kill -9 $pidq > /dev/null 2>&1
        kill -9 $pid > /dev/null 2>&1
      done
    done
  done

  # Naieve tests
  export TYPE="none" # no time annotation
  export INTERVAL=false # overwite last triples
  for UPDATEFREQUENCY in 1 2 5 10 20; do
    export UPDATEFREQUENCY=$UPDATEFREQUENCY
    file="$dir/naieve-"$UPDATEFREQUENCY".txt"
    fileProxyBins="$dir/naieve-proxyBins-"$UPDATEFREQUENCY".json"

    echo "File:      $file"
    echo "----------"

    node live-ldf-server config_train.json > /dev/null 2>&1 &
    pid=$!
    sleep 5

    ./proxy.sh $fileProxyBins &
    proxypid=$!
    node querytrainnaieve $TYPE > $file 2>/dev/null &
    pidq=$!
    TESTTIME=$(echo "$TESTEXECUTIONS * $UPDATEFREQUENCY" | bc -l)
    sleep $TESTTIME

    ./proxy.sh stop $proxypid
    kill -9 $pidq > /dev/null 2>&1
    kill -9 $pid > /dev/null 2>&1
  done
done

./plotTrainTests.sh $dirs
./plotTrainTestsRewriting.sh $dirs