#!/bin/bash
CLIENTS=$1
DURATION=$2
ID=$3
if [ -z "$SERVER" ]; then
    SERVER="127.0.0.1"
fi
HTTPBARRIERSERVERPORT=3010
HTTPBARRIERCLIENTPORT=3011
if [ -z "$HTTPBARRIERDIR" ]; then
    HTTPBARRIERDIR="/Users/kroeser/schooljaar/Thesis/http-barrier/"
fi

range=$(echo "$ID - $CLIENTS" | bc -l)
echo "clients: $CLIENTS; for duration: $DURATION; IDstart: $range"

# A small sleeptime between the startup of each client query.
FREQ=10
SLEEP=$(echo "scale=4;$FREQ / $CLIENTS" | bc -l)
echo "sleep offset: $SLEEP"

# Wait for the server and all other clients to start tests at exactly the same moment.
$HTTPBARRIERDIR"bin/http-barrier" $SERVER $HTTPBARRIERSERVERPORT $HTTPBARRIERCLIENTPORT
echo "Peers are up, initiate queries."

# Start all client queries
for i in $(seq 1 $CLIENTS); do
    ./client.sh $SERVER $i $(echo "$ID - $i" | bc -l) > /dev/null &
    pids[$i]=$!
    sleep $SLEEP
done

# Sleep for the test duration
sleep $DURATION

# Stop all client queries.
for i in $(seq 1 $CLIENTS); do
    kill -SIGTERM ${pids[$i]} > /var/tmp/kill-$i.tmp 2>&1
done
