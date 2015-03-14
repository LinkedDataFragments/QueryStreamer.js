#!/usr/bin/env bash
# Bootstrap script for the scalability tests on vwall

# Install required packages
apt-get update && apt-get -y install python-software-properties openjdk-7-jdk make g++ zip unzip git vim gnuplot zsh bc curl > /dev/null
add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get -y install nodejs

# Unzip test requirements
cd /var/tmp
mkdir csparql-test
unzip /groups/wall2-ilabt-iminds-be/ldf/exp/taquery/csparql-test.zip -d csparql-test
cd csparql-test/http-barrier
npm install -g
