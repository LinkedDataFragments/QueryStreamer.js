#!/usr/bin/env node

var fs = require('fs');

var data = JSON.parse(fs.readFileSync(process.argv[2]));
console.log("Time Bytes Requests");
for(var i = 0; i < data.binSize; i++) {
  console.log(i * data.binLength + " " + data.binsTotalBytes[i] + " " + data.binsRequests[i]);
}