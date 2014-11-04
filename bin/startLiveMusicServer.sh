#!/bin/bash

# Set the triple formatting type.
#TYPE="reification"
TYPE="singletonproperties"
#TYPE="graphs"

echo "Running format $TYPE"
echo ""

node generate $TYPE | sed "s/_:stmt/rdf:stmt/g" > radio.rdf
./rdf2hdt -f n3 radio.rdf radio.hdt
rm radio.hdt.index
ldf-server config_hdt.json &
pid=$!
sleep 1

echo "Executing continuous query..."
echo ""
echo ""

node query $TYPE
kill -9 $pid
