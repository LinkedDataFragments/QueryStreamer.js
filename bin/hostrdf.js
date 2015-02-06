#!/usr/bin/env node
/* Starts a simple HTTP server hosting the 'radio.rdf' file. */

var fs = require('fs')
    http = require("http");

var server = http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/turtle"});
  response.write(fs.readFileSync("radio.rdf").toString());
  response.end();
});
 
server.listen(8080);
console.log("Server is listening");
