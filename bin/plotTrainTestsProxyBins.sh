#!/bin/bash

file=$1
node parseTrainTestsProxybins.js $file > .proxyBins.data
gnuplot plotTrainTestsProxyBins.gplot > $file".png"
#gnuplot plotTrainTestsProxyBinsRequests.gplot > $file"-requests.png"