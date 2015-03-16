#!/bin/bash
CLIENTS=$1
FREQ=10
DURATION=$2
if [ -z "$SERVER" ]; then
    SERVER="127.0.0.1"
fi
HTTPBARRIERSERVERPORT=3010
HTTPBARRIERCLIENTPORT=3011
if [ -z "$HTTPBARRIERDIR" ]; then
    HTTPBARRIERDIR="/Users/kroeser/schooljaar/Thesis/http-barrier/"
fi

echo "clients: $CLIENTS; for duration: $DURATION"

# A small sleeptime between the startup of each client query.
SLEEP=$(echo "scale=4;$FREQ / $CLIENTS" | bc -l)
echo "sleep offset: $SLEEP"

# Wait for the server and all other clients to start tests at exactly the same moment.
$HTTPBARRIERDIR"bin/http-barrier" $SERVER $HTTPBARRIERSERVERPORT $HTTPBARRIERCLIENTPORT
echo "Peers are up, initiate queries."

# Start all client queries
for i in $(seq 1 $CLIENTS); do
    ./client.sh $SERVER $i > /dev/null  &
    pids[$i]=$!
    sleep $SLEEP
done

# Sleep for the test duration
sleep $DURATION

# Stop all client queries.
for i in $(seq 1 $CLIENTS); do
    kill -9 ${pids[$i]} > /dev/null 2>&1
done
