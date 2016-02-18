#!/bin/bash
# Start a CityBench server and query against it.

SERVER="../node_modules/ldf-server/bin/ldf-server"
DEBUG=true

# Set the triple formatting type.
#TYPE="reification"
#TYPE="singletonproperties"
TYPE="graphs"
#TYPE="implicitgraphs"

INTERVAL=false
CACHING=true

# ---- Don't change anything below this ----

if $DEBUG; then export DEBUG=true; fi

export TYPE=$TYPE
export SERVER=$SERVER
export CLIENTDIR=$CLIENTDIR
export INTERVAL=$INTERVAL
export CACHING=$CACHING
export UPDATEFREQUENCY=10
export INSERTPORT=4000
export TARGET="http://localhost:3001/train" # ldf endpoint

if $DEBUG; then
  echo "Format: $TYPE"
  echo "Intervals: $INTERVAL"
  echo "Caching: $CACHING"
  echo ""
fi

# Start the proxy between our client and server
./http-proxy &

# Setup the LDF server with updating data
if $DEBUG; then
  node ldf-server-http-inserter config_citybench.json &
else
  node ldf-server-http-inserter config_citybench.json > /dev/null &
fi
pid=$!
sleep 5

if $DEBUG; then
  echo "Server is up, initiating CityBench..."
  echo ""
  echo ""
fi

# This is where the benchmark should run
sleep 60000 # TODO


# Close all the things
wget http://localhost:3001/train/closeProxy > /dev/null 2>&1
sleep 2
kill -9 $!
kill -9 $pid
