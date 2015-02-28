#!/usr/bin/env node
/* Parse the results from the proxy measurements to a table containing average
 * burst durations compared to different naieve frequencies grouped over 10 seconds. */

var fs = require('fs');

var dir = process.argv[2];

var freqs = [1, 2, 5, 10, 20],
    //approachNames = ["reification", "singletonproperties", "graphs", "implicitgraphs"];
    approachNames = ["graphs"],
    group = 10,
    runs = 10;

var naives = freqs.map(function(el) { return fs.readFileSync(dir + "/naieve-" + el + ".txt", "utf8").split('\n'); });
var approaches = approachNames.map(function(el) { return fs.readFileSync(dir + "/annotation-" + el + "_interval-false_caching-true.txt", "utf8").split('\n'); });
//console.log("Frequency Naive Reification Singletonproperties Graphs Implicitgraphs");
console.log("Frequency Naive Graphs Scale");
/*var totalBytes = 0,
 totalRequests = 0; 
for(var i = 0; i < data.binSize; i++) {
  totalBytes += data.binsTotalBytes[i];
  totalRequests += data.binsRequests[i];
  console.log(i * data.binLength + " " + data.binsTotalBytes[i] + " " + data.binsRequests[i]);
}*/
for(var f = 0; f < freqs.length; f++) {
    var avgNaive = 0,
        avgApproach = 0;
    for(var i = 1; i < runs; i++) {
        avgNaive += parseInt(naives[f][i]);
        avgApproach += parseInt(approaches[0][i]);
    }
    avgNaive /= runs;
    avgApproach /= runs;
    var naiveMultiplier = 10 / freqs[f];
    console.log(freqs[f] + " " + naiveMultiplier * avgNaive + " " + avgApproach + " " + (avgApproach / (naiveMultiplier * avgNaive)));
}