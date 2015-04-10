#!/bin/bash
DURATION=$(echo "10 + $2" | bc -l)
if [ -z "$SERVERJAR" ]; then
    SERVERJAR="../build/libs/cqels-train-all-1.0.jar"
fi
HTTPBARRIERSERVERPORT=3010
CLIENTS=$1
if [ -z "$HTTPBARRIERDIR" ]; then
    HTTPBARRIERDIR="/Users/kroeser/schooljaar/Thesis/http-barrier/"
fi

# Start CSPARQL server
java -jar $SERVERJAR > /dev/null &
pid=$!

# Wait for all clients to signal test start at exactly the same moment.
"../"$HTTPBARRIERDIR"bin/http-barrier-server" $CLIENTS $HTTPBARRIERSERVERPORT
echo "Clients are up, initiate server measurements."

# Start measurements.
mkdir -p output
./measure_top.sh $pid > output/run-$3.txt &
mpid=$!

# Sleep for the test duration
sleep $DURATION

# Kill measurements and server
kill -9 $mpid
kill -9 $pid
