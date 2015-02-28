#!/bin/zsh
# Plot the naive comparisson.

data="output/.scale.data"
node tableTrainTestsProxyBinsFrequencies.js output/$1 > $data

file="output/plots/naivecompare-"$1".png"
gnuplot plotNaiveCompare.gplot > $file
