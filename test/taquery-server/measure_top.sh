#!/bin/bash

# Check for correct usage
if [ $# -ne 1 ]; then
    echo "Wrong usage" >&2
    echo $0" [pid]" >&2
    exit 1
fi

PID=$1

# Check if PID is number
re='^[0-9]+$'
if ! [[ $1 =~ $PID ]] ; then
    echo "Error" >&2
    echo "[pid] must be a number" >&2
    exit 1
fi

# Check if valid PID
if ! ps -p $PID > /dev/null ; then
   echo "Error" >&2
   echo "[pid] must be the process id of a running process" >&2
   exit 1
fi

# Start logging top output
echo "  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND"
top -b -d 1 | awk '{if($1 == '$PID'){ print;system(""); }}'
