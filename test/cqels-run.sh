#!/bin/bash

# Config options
DURATION=60
export SERVERJAR="../build/libs/cqels-train-all-1.0.jar"
export HTTPBARRIERDIR="../http-barrier/"
TYPE=$1
ID=$4

if [ "$TYPE" = "server" ]; then
    CLIENTS=$2 # The amount of concurrent client machines
    cd cqels-server/bin
else
    export SERVER=$2
    CLIENTS=$3 # The amount of concurrent client machines
    cd cqels-client
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
