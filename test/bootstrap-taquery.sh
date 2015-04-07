#!/usr/bin/env bash
# Bootstrap script for the scalability tests on vwall

# Install required packages
apt-get update && apt-get -y install python-software-properties openjdk-7-jdk make g++ zip unzip git vim gnuplot zsh bc > /dev/null
add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get -y install nodejs

# Unzip test requirements
cd /var/tmp
mkdir taquery-test
unzip /groups/wall2-ilabt-iminds-be/ldf/exp/taquery/taquery-test.zip -d taquery-test

# Init node modules
for r in data-replay http-barrier test-ldf/client-fork test-ldf/server-fork test-ldf/n3 time-annotated-query querygen; do
    cd /var/tmp
    cd taquery-test/$r
    npm install
done

# Link Client.js -> N3.js
cd /var/tmp/taquery-test/test-ldf/client-fork/node_modules
rm -rf n3
ln -s ../../n3/ n3

mkdir -p /groups/wall2-ilabt-iminds-be/ldf/exp/taquery/taquery-test/client-output
