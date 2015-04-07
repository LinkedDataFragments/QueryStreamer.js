#!/bin/bash

# Config options
DURATION=60

export HTTPBARRIERDIR="../http-barrier/"
export LDFCLIENTDIR="../../test-ldf/client-fork/"
export LDFSERVER="../../test-ldf/server-fork/bin/ldf-server"
export TADIR="../time-annotated-query/bin/"
export DATAREPLAYDIR="../data-replay/"
export DATAREPLAYCONFIG="../tests/data/train-replay-vwall.json"

TYPE=$1
export SERVER=$2
CLIENTS=$3 # The amount of concurrent client machines
ID=$4

if [ "$TYPE" = "server" ]; then
    cd taquery-server
else
    cd taquery-client
fi

# Run actual tests
for clients in $(seq 10 10 200); do
    if [ "$TYPE" = "server" ]; then
        ./run.sh $CLIENTS $DURATION $clients
    else
        innerId=$(echo "$clients / $CLIENTS" | bc -l)
        ./run.sh $innerId $DURATION $(echo "$innerId * $ID" | bc -l)
    fi
done

echo "Done"
