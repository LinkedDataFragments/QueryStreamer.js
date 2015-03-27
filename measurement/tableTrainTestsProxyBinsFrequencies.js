#!/usr/bin/env node
/* Parse the results from the proxy measurements to a table containing average
 * burst durations compared to different naieve frequencies grouped over 10 seconds. */

var fs = require('fs');

var dir = process.argv[2];

var freqs = range(500,20000,1000),//[1, 2, 5, 10, 20],
    //approachNames = ["reification", "singletonproperties", "graphs", "implicitgraphs"];
    approachNames = ["graphs"],
    group = 10,
    runs = 10;

var naives = freqs.map(function(el) { return fs.readFileSync(dir + "/naieve-"+el+".txt", "utf8").split('\n'); });
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
        avgApproach = 0,
        runsInner = runs;
    for(var i = 1; i < runs; i++) {
        var v = parseInt(naives[f][i]);
        if(isNaN(v)) {
            runsInner = i;
            break;
        }
        avgNaive += v;
    }
    for(var i = 1; i < runs; i++) {
        avgApproach += parseInt(approaches[0][i]);
    }
    avgNaive /= runsInner;
    avgApproach /= runs;
    var naiveMultiplier = 10 / freqs[f];
    console.log((freqs[f] - 500) / 1000 + " " + naiveMultiplier * avgNaive * 1000 + " " + avgApproach + " " + (avgApproach / (naiveMultiplier * avgNaive) / 1000));
}

function range(start, edge, step) {
  // If only one number was passed in make it the edge and 0 the start.
  if (arguments.length == 1) {
    edge = start;
    start = 0;
  }
 
  // Validate the edge and step numbers.
  edge = edge || 0;
  step = step || 1;
 
  // Create the array of numbers, stopping befor the edge.
  for (var ret = []; (edge - start) * step > 0; start += step) {
    ret.push(start);
  }
  return ret;
}
