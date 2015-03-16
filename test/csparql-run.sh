#!/bin/bash

# Config options
DURATION=60
export SERVERJAR="../build/libs/csparql-server-all-1.0.jar"
export HTTPBARRIERDIR="../http-barrier/"
TYPE=$1

if [ "$TYPE" = "server" ]; then
    CLIENTS=$2 # The amount of concurrent client machines
    cd csparql-server/bin
else
    export SERVER=$2
    CLIENTS=$3 # The amount of concurrent client machines
    cd csparql-client
fi

# Run actual tests
for clients in $(seq 10 10 200); do
    if [ "$TYPE" = "server" ]; then
        ./run.sh $CLIENTS $DURATION $clients
    else
        ./run.sh $(echo "$clients / $CLIENTS" | bc -l) $DURATION
    fi
done
