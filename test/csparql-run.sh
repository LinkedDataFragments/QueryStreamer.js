#!/bin/bash

# Config options
DURATION=60
export SERVERJAR="../build/libs/csparql-server-all-1.0.jar"
export SERVER=$2
export HTTPBARRIERDIR="../../http-barrier/"
TYPE=$1
CLIENTS=1 # The amount of concurrent client machines

if [ "$TYPE" = "server" ]; then
    cd csparql-server/bin
else
    cd csparql-client
fi

# Run actual tests
for clients in $(seq 1 100 1000); do
    if [ "$TYPE" = "server" ]; then
        ./run.sh $clients $DURATION
    else
        ./run.sh $(echo "$clients / $CLIENTS | bc -l") $DURATION
    fi
done
