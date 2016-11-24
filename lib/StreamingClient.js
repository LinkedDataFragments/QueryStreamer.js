/* A StreamingClient can stream query results. */

var clientLocation = (process.env.CLIENTDIR || '') + 'ldf-client';
var SparqlParser   = require('sparqljs').Parser,
    ldf            = require(clientLocation),
    timeUtil       = require('./TimeUtils.js'),
    MemoryCache    = require('./MemoryCache.js'),
    Rewriter       = require('./Rewriter.js'),
    Streamer       = require('./Streamer.js');

var debugMode = process.env.DEBUG === 'true';

// Allowed types: reification, singletonproperties, graphs
var type = process.argv.length > 2 ? process.argv[2] : "reification";

ldf.Logger.setLevel('error');

// Creates a new StreamingClient
function StreamingClient(config) {
  if (!(this instanceof StreamingClient))
    return new StreamingClient(config);

  if (!config.query) throw new Error('The query option is mandatory');
  if (!config.target) throw new Error('The target option is mandatory');

  var parser = new SparqlParser();
  this._debug(function() {
    console.log("------\nOriginal query:\n------");
    console.log(config.query);
    console.log("------");
  });

  this.query             = parser.parse(config.query);
  this.originalVariables = this.query.variables.slice(0);
  this.target            = config.target;
  this.durationCallback  = config.durationCallback || function(){};
  this._cachingEnabled   = config.cachingEnabled;
  this.startTime         = config.startTime;
}

StreamingClient.prototype.run = function(callback) {
  var rewriter = new Rewriter(ldf, type, this.target, this._cachingEnabled);
  var streamer = new Streamer(ldf, this.target, this.originalVariables, this.durationCallback, type);
  var self = this;
  var preSplitTile = timeUtil.getTime();
  var nowOffset = (self.startTime || preSplitTile) - preSplitTile;
  rewriter.split(this.query, function(context) {
    self.durationCallback(timeUtil.getTime() - preSplitTile);

    if(!context.dynamicStep) {
      throw Error("The given query is not dynamic.");
    }
    context.cache       = new MemoryCache();
    streamer._taCounter = rewriter._taCounter;

    // Initiate the streaming.
    streamer.executeQuery(context, callback, timeUtil.getTime(), nowOffset);
  });

};

StreamingClient.prototype._debug = function(callback) {
  debugMode && callback();
};

module.exports = StreamingClient;
