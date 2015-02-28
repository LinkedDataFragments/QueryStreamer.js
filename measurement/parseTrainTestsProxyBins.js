#!/usr/bin/env node
/* Parse the results from the proxy measurements to a gnuplot-ready output using stdout. */

var fs = require('fs');

var data = JSON.parse(fs.readFileSync(process.argv[2]));
console.log("Time Bytes Requests");
var totalBytes = 0,
 totalRequests = 0; 
for(var i = 0; i < data.binSize; i++) {
  totalBytes += data.binsTotalBytes[i];
  totalRequests += data.binsRequests[i];
  console.log(i * data.binLength + " " + data.binsTotalBytes[i] + " " + data.binsRequests[i]);
}

console.error("Total of " + totalBytes + " bytes over " + totalRequests + " requests.");