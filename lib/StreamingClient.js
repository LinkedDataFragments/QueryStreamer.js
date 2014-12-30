/* A StreamingClient can stream query results. */

var clientLocation = (process.env.CLIENTDIR || '') + 'ldf-client';
var SparqlParser   = require('sparqljs').Parser,
    ldf            = require(clientLocation),
    timeUtil       = require('./TimeUtils.js'),
    MemoryCache    = require('./MemoryCache.js'),
    Rewriter       = require('./Rewriter.js'),
    Streamer       = require('./Streamer.js');

var debugMode = true;

// Allowed types: reification, singletonproperties, graphs
var type = process.argv.length > 2 ? process.argv[2] : "reification";

ldf.Logger.setLevel('error');

// Creates a new StreamingClient
function StreamingClient(query, target) {
  if (!(this instanceof StreamingClient))
    return new StreamingClient(query, target);

  var parser = new SparqlParser();
  this._debug(function() {
    console.log("------\nOriginal query:\n------");
    console.log(query);
    console.log("------");
  });

  this.query             = parser.parse(query);
  this.originalVariables = this.query.variables.slice(0);
  this.target            = target;
}

StreamingClient.prototype.run = function(callback) {
  var rewriter = new Rewriter(ldf, type, this.target);
  var streamer = new Streamer(ldf, this.target, this.originalVariables);

  rewriter.split(this.query, function(context) {
    if(!context.dynamicStep) {
      throw Error("The given query is not dynamic.");
    }
    context.cache       = new MemoryCache();
    streamer._taCounter = rewriter._taCounter;

    // Initiate the streaming.
    streamer.executeQuery(context, callback, timeUtil.getTime());
  });

};

StreamingClient.prototype._debug = function(callback) {
  debugMode && callback();
};

module.exports = StreamingClient;