#!/bin/bash
cd /home/vagrant/time-annotated-query/measurement
export SERVER=/home/vagrant/Server.js/bin/ldf-server
export CLIENTDIR=/home/vagrant/Client.js/
./runTrainTests.sh

#cd /home/vagrant/time-annotated-query/bin
#export SERVER=/home/vagrant/Server.js/bin/ldf-server
#export CLIENTDIR=/home/vagrant/Client.js/
#for TYPE in reification singletonproperties graphs; do
#    export TYPE=$TYPE
#    node live-ldf-server config_train.json &
#    pid=$!
#    sleep 5
#    node querytrain $TYPE
#    kill -9 $pid
#done
