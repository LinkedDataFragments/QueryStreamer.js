#!/bin/bash
PORT=3002
HOST=$1
run=true

# Replace query by a randomly generated one
#dir=$(pwd) && cd ../querygen && ./generate.js data/querycsparql.template $3 > $dir/query.csparql && cd $dir

curl -s -d "$(cat query.csparql | sed "s/TrainDepartures/TrainDepartures$2/")" $HOST:$PORT/register > /dev/null &
pid=$!

# Start measurements.
mkdir -p output
./measure_top.sh $pid > /groups/wall2-ilabt-iminds-be/ldf/exp/taquery/csparql-test/client-output/run-$2-$(echo "scale=0;$3/1" | bc -l).txt &
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
