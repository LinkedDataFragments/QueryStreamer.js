#!/bin/bash

if [ -z "$LDFCLIENTDIR" ]; then
    LDFCLIENTDIR="/Users/kroeser/schooljaar/Thesis/test-ldf/client-fork/"
fi
if [ -z "$TADIR" ]; then
    TADIR="/Users/kroeser/schooljaar/Thesis/time-annotated-query/bin/"
fi

TARGET="http://$1:3000/train" # ldf endpoint
TYPE="graphs"
export TARGET=$TARGET
export CLIENTDIR=$LDFCLIENTDIR
export DEBUG=true

node $TADIR/querytrain $TYPE > /var/tmp/client-debug.log 2>&1
