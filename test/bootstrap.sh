#!/usr/bin/env bash
# Bootstrap script for the execution time tests for TA-query on vagrant

# Install required packages
apt-get update && apt-get -y install openjdk-7-jdk make g++ zip git vim gnuplot zsh bc msttcorefonts ttf-mscorefonts-installer > /dev/null

# Install Node
wget –quiet http://nodejs.org/dist/v0.10.35/node-v0.10.35-linux-x86.tar.gz
dir=$(pwd)
cd /usr/local && tar --strip-components 1 -xzf $dir/node-v0.10.35-linux-x86.tar.gz
cd $dir

cp /vagrant/test/user_bootstrap.sh user_bootstrap.sh
chmod a+x user_bootstrap.sh
su vagrant user_bootstrap.sh
