#!/bin/bash
PORT=3002
HOST=$1
curl -s -d "$(cat query.csparql | sed "s/TrainDepartures/TrainDepartures$2/")" $HOST:$PORT/register > /dev/null
