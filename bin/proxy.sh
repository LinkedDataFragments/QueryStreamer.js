#!/bin/bash
if [ $1 == "stop" ]; then
  wget http://localhost:3001/train/closeProxy > /dev/null 2>&1
  sleep 1
  kill -9 $2
else
  export PROXYBINSFILE=$1
  ./http-proxy
fi