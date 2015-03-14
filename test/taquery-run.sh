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

if [ "$TYPE" = "server" ]; then
    cd taquery-server
else
    cd taquery-client
fi

# Run actual tests
for clients in $(seq 1 100 1001); do
    if [ "$TYPE" = "server" ]; then
        ./run.sh $CLIENTS $DURATION $clients
    else
        ./run.sh $(echo "$clients / $CLIENTS" | bc -l) $DURATION
    fi
done
