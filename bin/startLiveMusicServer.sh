#!/bin/bash
node generate | sed "s/_:stmt/rdf:stmt/g" > radio.rdf
./rdf2hdt -f n3 radio.rdf radio.hdt
rm radio.hdt.index
ldf-server config_hdt.json &
pid=$!
sleep 1

echo "Executing continuous query..."
echo ""
echo ""

node query
kill -9 $pid
