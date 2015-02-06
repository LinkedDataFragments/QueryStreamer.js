#!/bin/bash
# Plot the bandwidth from the train tests.

file=$1
node parseTrainTestsProxybins.js $file > output/.proxyBins.data
gnuplot plotTrainTestsProxyBins.gplot > $file".png"
#gnuplot plotTrainTestsProxyBinsRequests.gplot > $file"-requests.png"