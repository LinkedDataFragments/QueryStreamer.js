/* A QueryRewriter rewrites the given query to ask for relevant time annotation data. */

var clientLocation = (process.env.CLIENTDIR || '') + 'ldf-client';
var SparqlParser = require('sparqljs').Parser,
    ldf = require(clientLocation),
    util = require('./RdfUtils.js'),
    Composer = require('./SparqlComposer.js');
require('js-object-clone');

// Allowed types: reification, singletonproperties, graphs
var type = process.argv.length > 2 ? process.argv[2] : "reification";

ldf.Logger.setLevel('error');

var debugMode = true;

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
  this.query = parser.parse(query);
  this.originalVariables = this.query.variables;
  this.target = target;
  //console.log(JSON.stringify(query, null, "  "));
  this.fragmentsClient = new ldf.FragmentsClient(target);
}

StreamingClient.prototype._tripleTransformer = {
  reification: util.timeAnnotatedReification,
  singletonproperties: util.timeAnnotatedSingletonProperties,
  graphs: util.timeAnnotatedQuads,
}[type];

StreamingClient.prototype.run = function(callback) {
  var self = this;
  this._executeTransformation(this.query.prefixes, this.query.variables, this.query.where, function(modifiedQuery, hasTimeAnnotation) {
    self.query.where = modifiedQuery;

    if(hasTimeAnnotation) {
      self.query.variables = self.query.variables.concat(["?initial", "?final"]);
      self.query.prefixes = self._extendObject({
        "tmp": util.prefixes.tmp,
        "sp": util.prefixes.sp,
      }, self.query.prefixes)
    }

    //console.log(JSON.stringify(query, null, "  "));

    // TODO: construct a new query using from JSON format
    var composer = new Composer(self.query);
    var result = composer.compose();
    self._debug(function() {
      console.log("------\nNew query:\n------");
      console.log("Has time annotation? " + (hasTimeAnnotation ? "true" : "false") + "\n");
      console.log(result);
      console.log("------");
      console.log("\nLive query results:\n------------------------\n");
    });
    var context = {counter: 0, hasTimeAnnotation: hasTimeAnnotation};
    self._executeQuery(result, context);
  });
};

function flatten(array) { return [].concat.apply([], array); }

/**
 * Transform a query.
 * This will loop over each triple pattern fragment and modify it to an equivalent reified form
 * if a query to the endpoint pointed out that it has a reified form for that triple.
 * @param prefixes The accumulated prefixes
 * @param variables The accumulated variables
 * @param queryPart The input query part.
 * @param resultsCallback Callback with the resulting modified query part.
 */
StreamingClient.prototype._executeTransformation = function(prefixes, variables, queryPart, resultsCallback) {
  var result;
  var self = this;
  if(queryPart instanceof Array) {
    result = [];
    var bufferHasTimeAnnotation = false;
    for(var i = 0; i < queryPart.length; i++) {
      this._executeTransformation(prefixes, variables, queryPart[i], function(modifiedQueryPart, hasTimeAnnotation) {
        result.push(modifiedQueryPart);
        bufferHasTimeAnnotation = hasTimeAnnotation | bufferHasTimeAnnotation;
        if(result.length == queryPart.length) { // If at the end of the loop
          resultsCallback(flatten(result), bufferHasTimeAnnotation);
        }
      });
    }
  } else if(queryPart.type == "bgp") {
    result = Object.clone(queryPart);
    this._executeTransformation(prefixes, variables, queryPart.triples, function(modifiedQueryPart, hasTimeAnnotation) {
      result.triples = modifiedQueryPart;
      resultsCallback(result, hasTimeAnnotation);
    });
  } else if(queryPart.type == "union") {
    result = Object.clone(queryPart);
    this._executeTransformation(prefixes, variables, queryPart.patterns, function(modifiedQueryPart, hasTimeAnnotation) {
      result.patterns = modifiedQueryPart;
      resultsCallback(result, hasTimeAnnotation);
    });
  } else {
    this._shouldTransform(prefixes, variables, queryPart, function(shouldTransform) {
      if(shouldTransform) {
        var modified = self._tripleTransformer(queryPart);
        // Don't take UNION, preference for TA triples.
        /*var modified = {
         type: "union",
         patterns: [
         queryPart,
         tripleTransformer(queryPart)
         ]
         };*/
        resultsCallback(modified, true);
      } else {
        resultsCallback(queryPart, false);
      }
    });
  }
};

StreamingClient.prototype._extendObject = function(self, source) {
  for (var property in source) {
    if (source.hasOwnProperty(property)) {
      self[property] = source[property];
    }
  }
  return self;
};

/**
 * Check if the given triple should be transformed (reified || ...).
 * @param prefixes The accumulated prefixes
 * @param variables The accumulated variables
 * @param triple The triple object.
 * @param callback The true/false callback.
 */
StreamingClient.prototype._shouldTransform = function(prefixes, variables, triple, callback) {
  var subQuery = { // TODO: improve
    "type": "query",
    "prefixes": this._extendObject({
      "tmp": util.prefixes.tmp,
      "sp": util.prefixes.sp
    }, prefixes),
    "queryType": "SELECT",
    "variables": variables.concat([
      "?initial",
      "?final"
    ]),
    "where": [
      {
        "type": "bgp",
        "triples": this._tripleTransformer(triple),
      }
    ]
  };
  var composer = new Composer(subQuery);
  var result = composer.compose();
  this._debug(function() {
    console.log("Transformation: --- \n" + result + "\n--- \n");
  });
  var self = this;
  this._isQueryNotEmpty(result, function(res) {
    self._debug(function() {
      console.log("Triple " + JSON.stringify(triple) + " should" + (res ? "" : " NOT") + " be transformed.");
    });
    callback(res);
  });
};

/**
 * Perform a query to the server to check if the given query gives at least one result.
 * @param query The query.
 * @param callback The callback with true (query result is not empty) or false (query result is empty).
 */
StreamingClient.prototype._isQueryNotEmpty = function(subQuery, callback) {
  this.fragmentsClient = new ldf.FragmentsClient(this.target);
  var results = new ldf.SparqlIterator(subQuery, { fragmentsClient: this.fragmentsClient });
  var shouldCall = true;
  results.on('data', function (row) {
    //console.log(row);
    shouldCall && !(shouldCall = false && results.end()) && callback(true);
    // Stop the iterator, we already have all the info we need.
  });
  results.on('end', function() {
    shouldCall && !(shouldCall = false) && callback(false);
    shouldCall = false;
  });
  results.on('error', function() {
    shouldCall && callback(false);
    shouldCall = false;
  });
};

StreamingClient.prototype._executeQuery = function(subQuery, context) {
  console.log("Result: " + context.counter++ + "\n------\n");
  this.fragmentsClient = new ldf.FragmentsClient(this.target);
  var results = new ldf.SparqlIterator(subQuery, { fragmentsClient: this.fragmentsClient });
  var self = this;
  results.on('data', function (row) {
    if(self._isCurrent(row)) {
      // TODO: Currently prints the variable results.
      var out = {};
      self.originalVariables.forEach(function(variable) {
        out[variable] = row[variable];
      });
      console.log(out);
      context.updateAt = self._getUpdateTime(row);
    }
  });
  results.on('end', function() {
    if(context.hasTimeAnnotation && context.updateAt) {
      var timeOut = context.updateAt - (new Date().getTime());
      if(timeOut < 0) {
        timeOut = 10000;
        console.log("No newer data found on server, will wait 10 seconds.");
      } else {
        console.log("Will update after: " + timeOut/1000 + "s");
      }
      setTimeout(function() {
        self._executeQuery(subQuery, context);
      }, timeOut);
    }
  });
  results.on('error', function(e) {
    console.log("Error while streaming! " + e);
  });
};

StreamingClient.prototype._getUpdateTime = function(variables) {
  return this._parseTimeVariable(variables["?final"]);
}

StreamingClient.prototype._isCurrent = function(variables) {
  var initial = this._parseTimeVariable(variables["?initial"]);
  var final = this._parseTimeVariable(variables["?final"]);
  var current = new Date().getTime();
  return initial <= current && current <= final;
}

StreamingClient.prototype._parseTimeVariable = function(timeVariable) {
  var timeString = timeVariable.replace(/\^\^.*/g, "").replace(/"/g, "");
  return Date.parse(timeString);
}

StreamingClient.prototype._debug = function(callback) {
  debugMode && callback();
}

module.exports = StreamingClient;