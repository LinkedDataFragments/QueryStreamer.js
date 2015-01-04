#!/bin/bash

SERVER="/Users/kroeser/schooljaar/Thesis/test-ldf/server-fork/bin/ldf-server"
CLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"

# seconds each test should take
TESTTIME=60
# seconds between each data update server-side
export UPDATEFREQUENCY=10

dir="test"$(date +%s)
mkdir $dir

for TYPE in reification singletonproperties graphs implicitgraphs; do
  for INTERVAL in true false; do
    for CACHING in true false; do
      export TYPE=$TYPE
      export SERVER=$SERVER
      export CLIENTDIR=$CLIENTDIR
      export INTERVAL=$INTERVAL
      export CACHING=$CACHING

      file="$dir/annotation-"$TYPE"_interval-"$INTERVAL"_caching-"$CACHING".txt"

      echo "Format:    $TYPE"
      echo "Intervals: $INTERVAL"
      echo "Caching:   $CACHING"
      echo "File:      $file"
      echo "----------"

      node live-ldf-server config_train.json > /dev/null 2>&1 &
      pid=$!
      sleep 5

      node querytrain $TYPE > $file 2>/dev/null &
      pidq=$!
      sleep $TESTTIME

      kill -9 $pidq > /dev/null 2>&1
      kill -9 $pid > /dev/null 2>&1
    done
  done
done

./plotTrainTests.sh $dir