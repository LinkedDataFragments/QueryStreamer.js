#!/bin/bash

if [ -z "$LDFCLIENTDIR" ]; then
    LDFCLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"
fi
if [ -z "$TADIR" ]; then
    TADIR="/Users/kroeser/schooljaar/Thesis/time-annotated-query/bin/"
fi

TARGET="http://$1:3000/train" # ldf endpoint
TYPE="graphs"
export TARGET=$TARGET
export CLIENTDIR=$LDFCLIENTDIR
export DEBUG=true
run=true

# Replace query by a randomly generated one
#dir=$(pwd) && cd ../querygen && ./generate.js data/query.template $3 > $TADIR/train.sparql && cd $dir

node $TADIR/querytrain $TYPE > /var/tmp/client-debug.log 2>&1 &
pid=$!

# Start measurements.
mkdir -p output
./measure_top.sh $pid > /groups/wall2-ilabt-iminds-be/ldf/exp/taquery/taquery-test/client-output/run-$2-$(echo "scale=0;$3/1" | bc -l).txt &
mpid=$!

function clean_up {
    kill -9 $mpid
    kill -9 $pid
    run=false
    echo "Cleaning up $mpid and $pid"
    exit
}

# Make sure the querier is stopped when this script is killed.
trap clean_up SIGHUP SIGINT SIGTERM

# Sleep indefinitely
while $run; do sleep 1; done
