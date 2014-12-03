/* A QueryRewriter rewrites the given query to ask for relevant time annotation data. */

var clientLocation = (process.env.CLIENTDIR || '') + 'ldf-client';
var SparqlParser = require('sparqljs').Parser,
    ldf = require(clientLocation),
    util = require('./RdfUtils.js'),
    MemoryCache = require('./MemoryCache.js'),
    clc = require('cli-color'),// TODO: remove, only for easy debugging
    Composer = require('./SparqlComposer.js');
require('js-object-clone');

// Allowed types: reification, singletonproperties, graphs
var type = process.argv.length > 2 ? process.argv[2] : "reification";

var taCounter = 0;

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
  this.originalVariables = this.query.variables.slice(0);
  this.target = target;
  this.fragmentsClient = new ldf.FragmentsClient(target);
}

StreamingClient.prototype._tripleTransformer = {
  reification: util.timeAnnotatedReification,
  singletonproperties: util.timeAnnotatedSingletonProperties,
  graphs: util.timeAnnotatedQuads,
}[type];

StreamingClient.prototype.run = function(callback) {
  var self = this,
      cache = new MemoryCache();
  taCounter = 0;
  this._splitStaticDynamicQuery(this.query.prefixes, this.query.variables, this.query.where, function(staticHolder, dynamicHolder) {
    polishQueryHolder(staticHolder);
    polishQueryHolder(dynamicHolder);
    //console.log(JSON.stringify(staticHolder, false, "  "));
    //console.log(JSON.stringify(dynamicHolder, false, "  "));

    // TODO: find disjunction of the two variable parts to determine the static part cache key.
    var disjointVariables = disjunction(staticHolder.variables, dynamicHolder.variables);
    var hasTimeAnnotation = !!dynamicHolder.where;

    var dynamicResult = new Composer(dynamicHolder).compose();
    self._debug(function() {
      console.log("------\nNew query:\n------");
      console.log("Has time annotation? " + (hasTimeAnnotation ? "true" : "false") + "\n");
      console.log(dynamicResult);
      console.log("------");
      console.log(new Composer(staticHolder).compose());
      console.log("------");
      console.log("\nLive query results:\n------------------------\n");
    });

    var context = {
      counter:           0,
      hasTimeAnnotation: hasTimeAnnotation,
      distinct:          self.query.distinct,
      staticHolder:      staticHolder,
      dynamicQuery:      dynamicResult,
      disjointVariables: disjointVariables,
      cache:             cache
    };

    self._executeQuery(context, callback, new Date().getTime());
  });

  function polishQueryHolder(queryHolder) {
    queryHolder.type = 'query';
    queryHolder.queryType = 'SELECT';

    // Append all variables in the WHERE clause that are not there yet.
    // These will not become visible to the user, but is required to make query splitting work.
    self._appendAllVariables(queryHolder.variables, queryHolder.where);

    queryHolder.variables = Object.keys(queryHolder.variables);
  }
};

StreamingClient.prototype._appendAllVariables = function(variables, queryPart) {
  var self = this;
  if(queryPart instanceof Array) {
    queryPart.forEach(function(el) { self._appendAllVariables(variables, el); });
  } else if(queryPart.type == "bgp") {
    this._appendAllVariables(variables, queryPart.triples);
  } else if(queryPart.type == "union") {
    this._appendAllVariables(variables, queryPart.patterns);
  } else {
    var fields = ["subject", "predicate", "object", "context"];
    fields.forEach(function(field) {
      if(queryPart[field] && queryPart[field].charAt(0) == '?') {
        variables[queryPart[field]] = true;
      }
    });
  }
};

function disjunction(array1, array2) {
  var newArray = [];
  // Arrays are not sorted, so this will be O(n^2)
  // Arrays are assumed to be sets.
  array1.forEach(function(el1) {
    array2.forEach(function(el2) {
      if(el1 == el2) newArray.push(el1);
    });
  });
  return newArray;
}

function flatten(array) { return [].concat.apply([], array); }

/**
 * Split up a query into a dynamic and static part.
 * @param prefixes The accumulated prefixes
 * @param variables The accumulated variables
 * @param where The input query part.
 * @param resultsCallback Callback with the resulting static and dynamic queries.
 */
StreamingClient.prototype._splitStaticDynamicQuery = function(prefixes, variables, where, resultsCallback) {
  var self = this,
    resultStaticQuery, resultDynamicQuery;
  if(where instanceof Array) {
    resultStaticQuery  = [],
    resultDynamicQuery = [];
    var called = 0;
    for(var i = 0; i < where.length; i++) {
      this._splitStaticDynamicQuery(prefixes, variables, where[i], function(staticHolder, dynamicHolder) {
        called++;
        staticHolder.where   && resultStaticQuery.push(staticHolder);
        dynamicHolder.where  && resultDynamicQuery.push(dynamicHolder);
        if(called == where.length) { // If at the end of the loop
          resultsCallback(flattenQueryHolders(resultStaticQuery), flattenQueryHolders(resultDynamicQuery));
        }
      });
    }
  } else if(where.type == "bgp") {
    this._splitStaticDynamicQuery(prefixes, variables, where.triples, function(staticHolder, dynamicHolder) {
      resultStaticQuery  = initQueryHolder(where),
      resultDynamicQuery = initQueryHolder(where);
      appendAllQueryHolders(resultStaticQuery, [staticHolder], true);
      appendAllQueryHolders(resultDynamicQuery, [dynamicHolder], true);
      resultStaticQuery.where.triples = staticHolder.where;
      resultDynamicQuery.where.triples = dynamicHolder.where;
      resultsCallback(resultStaticQuery, resultDynamicQuery);
    });
  } else if(where.type == "union") {
    this._splitStaticDynamicQuery(prefixes, variables, where.patterns, function(staticHolder, dynamicHolder) {
      resultStaticQuery  = initQueryHolder(where),
      resultDynamicQuery = initQueryHolder(where);
      if(dynamicHolder.where.length == 0) {
        appendAllQueryHolders(resultStaticQuery, [staticHolder], true);
        resultStaticQuery.where.patterns = staticHolder;
      } else if(staticHolder.where.length == 0) {
        appendAllQueryHolders(resultDynamicQuery, [dynamicHolder], true);
        resultDynamicQuery.where.patterns = dynamicHolder;
      } else {
        // In this case we have a mixed union of static and dynamic parts
        // IMPOSSIBLE to have disjoint static and dynamic parts, so we will put everything inside the dynamic part.
        // Note that optimisations for this case are very likely! (For example when only ONE union-group with mixed
        // static/dynamic parts after some transformations to make sure that the union part is last in the query)
        // TODO: test this!
        appendAllQueryHolders(resultDynamicQuery, [staticHolder, dynamicHolder], true);
        resultDynamicQuery.where.patterns = flattenQueryHolders([staticHolder, dynamicHolder]);
      }
      resultsCallback(resultStaticQuery, resultDynamicQuery);
    });
  } else {
    this._shouldTransform(prefixes, variables, where, function(shouldTransform) {
      var resultStaticQuery  = initQueryHolder(),
          resultDynamicQuery = initQueryHolder();
      if(shouldTransform) {
        var modified = self._tripleTransformer(where, function() {
          resultDynamicQuery.variables["?initial" + taCounter] = true;
          resultDynamicQuery.variables["?final" + taCounter] = true;
          resultDynamicQuery.prefixes["tmp"] = util.prefixes.tmp;
          resultDynamicQuery.prefixes["sp"] = util.prefixes.sp;
          return taCounter++;
        });
        appendQueryPart(resultDynamicQuery, modified, prefixes, variables);
      } else {
        appendQueryPart(resultStaticQuery, where, prefixes, variables);
      }
      resultsCallback(resultStaticQuery, resultDynamicQuery);
    });
  }

  function initQueryHolder(where) {
    return {
      variables: {},
      prefixes: {},
      where: where ? Object.clone(where, true) : false
    };
  }

  var fields = ["subject", "predicate", "object", "context"];
  function appendQueryPart(queryHolder, where, prefixes, variables) {
    // Copy query part
    queryHolder.where = where;

    if(where instanceof Array) {
      where.forEach(appendMeta);
    } else {
      appendMeta(where);
    }

    function appendMeta(where) {
      // Copy used variables
      variables.forEach(function (variable) {
        var shouldAdd = fields.reduce(function (acc, field) {
          return acc || (variable == where[field]);
        }, false);
        if (shouldAdd) {
          queryHolder.variables[variable] = true;
        }
      });

      // Copy used prefixes
      Object.keys(prefixes).forEach(function (prefix) {
        var shouldAdd = fields.reduce(function (acc, field) {
          return acc || (where[field].indexOf(prefix) == 0);
        });
        if (shouldAdd) {
          queryHolder.prefixes[prefix] = prefixes[prefix];
        }
      });
    }
  }

  function flattenQueryHolders(queryHolders) {
    var queryHolder = initQueryHolder();
    queryHolder.where = [];
    return appendAllQueryHolders(queryHolder, queryHolders);
  }

  function appendAllQueryHolders(queryHolder, queryHolders, skipQueryPart) {
    queryHolders.forEach(function(qHolder) {
      queryHolder.variables = concatMap(queryHolder.variables, qHolder.variables);
      queryHolder.prefixes  = concatMap(queryHolder.prefixes,  qHolder.prefixes);
      if(!skipQueryPart) queryHolder.where = queryHolder.where.concat(qHolder.where);
    });
    return queryHolder;
  }

};

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
    result = Object.clone(queryPart, true);
    this._executeTransformation(prefixes, variables, queryPart.triples, function(modifiedQueryPart, hasTimeAnnotation) {
      result.triples = modifiedQueryPart;
      resultsCallback(result, hasTimeAnnotation);
    });
  } else if(queryPart.type == "union") {
    result = Object.clone(queryPart, true);
    this._executeTransformation(prefixes, variables, queryPart.patterns, function(modifiedQueryPart, hasTimeAnnotation) {
      result.patterns = modifiedQueryPart;
      resultsCallback(result, hasTimeAnnotation);
    });
  } else {
    this._shouldTransform(prefixes, variables, queryPart, function(shouldTransform) {
      if(shouldTransform) {
        var modified = self._tripleTransformer(queryPart, function() {
          variables.push("?initial" + taCounter);
          variables.push("?final" + taCounter);
          return taCounter++;
        });
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
  var subQuery = {
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
 * @param subQuery The query.
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

StreamingClient.prototype._executeQuery = function(context, callback, calledAt) {
  this._debug(function() {
    console.log("Result: " + context.counter++ + "\n------\n");
  });
  this.fragmentsClient = new ldf.FragmentsClient(this.target);
  var results = new ldf.SparqlIterator(context.dynamicQuery, { fragmentsClient: this.fragmentsClient });
  var self = this;
  var startTime = new Date().getTime();
  var resultUpdateTimes = {};
  context.updateAt = false;
  results.on('data', function (row) {
    if(self._areAllCurrent(row, calledAt)) {
      // Determine new update time
      var thisUpdateTime = self._getMinimumUpdateTime(row);

      // Get the static data for this row from cache or execute new query.
      self._populateStaticdata(row, context.disjointVariables, Object.clone(context.staticHolder, true), context.cache,
        function(results) {
        results.forEach(function(result) {
          var out = {};
          var resultHash = "";

          // Determine output
          self.originalVariables.forEach(function(variable) {
            resultHash += variable + "=" + row[variable];
            out[variable] = result[variable];
          });

          if(!resultUpdateTimes[resultHash] || !context.distinct) {
            // Send the callback if it has not been sent before (or if DISTINCT was not specified)

            // Flush
            callback(out, context.counter);

            // Mark result as 'sent' in cache
            resultUpdateTimes[resultHash] = thisUpdateTime;

            // Set update at
            context.updateAt = self._replaceUpdateTime(context.updateAt, thisUpdateTime);
          } else {
            // If the results were already sent, the updateAt could still be changed if this new result has a LATER updateTime
            // than the one stored for this result.

            if(resultUpdateTimes[resultHash] < thisUpdateTime) {
              resultUpdateTimes[resultHash] = thisUpdateTime;
              context.updateAt = self._replaceUpdateTime(context.updateAt, thisUpdateTime);
            }
          }
        });
      });

    }
  });
  results.on('end', function() {
    self._debug(function() {
      var currentTime = new Date().getTime();
      console.log(clc.green("Client request time: " + (currentTime - startTime) / 1000 + " seconds"));
    });
    if(context.hasTimeAnnotation) {
      if(!context.updateAt) {
        context.updateAt = new Date().getTime();
      }
      var timeOut = context.updateAt - (new Date().getTime());
      if(timeOut <= 0) {
        timeOut = 1000;
        self._debug(function() {
          console.log("Second skipping...");
        });
      } else {
        self._debug(function() {
          console.log("Will update in: " + timeOut / 1000 + "s");
        });
      }
      setTimeout(function() {
        self._executeQuery(context, callback, new Date().getTime());
      }, timeOut);
    } else {
      console.log("No valid context time found, stopping.");
    }
  });
  results.on('error', function(e) {
    console.log("Error while streaming! " + e);
  });
};

StreamingClient.prototype._bindVariablesQuery = function(row, disjointVariables, queryHolder) {
  // TODO: move this first part to preprocess, just a small optimization
  disjointVariables.forEach(function(variable) {
    var index = queryHolder.variables.indexOf(variable);
    if(index > -1) {
      queryHolder.variables.splice(index, 1);
    }
  });
  this._bindVariablesQueryPart(row, disjointVariables, queryHolder.where);
};

StreamingClient.prototype._bindVariablesQueryPart = function(row, disjointVariables, queryPart) {
  var self = this;
  if(queryPart instanceof Array) {
    queryPart.forEach(function(el) { self._bindVariablesQueryPart(row, disjointVariables, el); });
  } else if(queryPart.type == "bgp") {
    this._bindVariablesQueryPart(row, disjointVariables, queryPart.triples);
  } else if(queryPart.type == "union") {
    this._bindVariablesQueryPart(row, disjointVariables, queryPart.patterns);
  } else {
    var fields = ["subject", "predicate", "object", "context"];
    fields.forEach(function(field) {
      disjointVariables.forEach(function(variable) {
        if(queryPart[field] == variable) {
          queryPart[field] = "<" + row[variable] + ">";
        }
      });
    });
  }
};

StreamingClient.prototype._populateStaticdata = function(row, disjointVariables, staticHolder, cache, callback) {
  var key = generateCacheKey(row, disjointVariables);

  if(cache.hasKey(key)) {
    //console.log("Got static data from cache: " + key);
    mergeResults(row, cache.get(key), callback);
  } else {
    //console.log("Fetching static data: " + key);

    var staticResults = [];

    // Replace the dynamic variables inside the static query.
    this._bindVariablesQuery(row, disjointVariables, staticHolder);

    // Fetch static results
    var results = new ldf.SparqlIterator(new Composer(staticHolder).compose(), { fragmentsClient: this.fragmentsClient });
    results.on('data', function (row) {
      staticResults.push(row);
    });
    results.on('end', function() {
      cache.put(key, staticResults);
      mergeResults(row, staticResults, callback);
    });
    results.on('error', function(e) {
      console.log("Error while streaming! " + e);
    });
  }

  function mergeResults(row, staticResults, callback) {
    callback(staticResults.map(function(staticResult) {
      return concatMap(row, staticResult);
    }));
  }

  function generateCacheKey(row, disjointVariables) {
    return disjointVariables.reduce(function(key, variable) {
      return key + variable + "=\"" + row[variable] + "\"";
    }, "");
  }
};

function concatMap(map1, map2) {
  var newMap = {}, attrName;
  for (attrName in map1) { newMap[attrName] = map1[attrName]; }
  for (attrName in map2) { newMap[attrName] = map2[attrName]; }
  return newMap;
}

StreamingClient.prototype._replaceUpdateTime = function(updateAt, newUpdateAt) {
  return (updateAt && updateAt < newUpdateAt) ? updateAt : newUpdateAt;
};

StreamingClient.prototype._getMinimumUpdateTime = function(variables) {
  var minimumUpdateTime = -1;
  for(var i = 0; i < taCounter; i++) {
    var updateTime = this._getUpdateTime(variables, i);
    if(updateTime < minimumUpdateTime || minimumUpdateTime == -1) {
      minimumUpdateTime = updateTime;
    }
  }
  return minimumUpdateTime;
};

StreamingClient.prototype._getUpdateTime = function(variables, variableCount) {
  return this._parseTimeVariable(variables["?final" + variableCount]);
};

StreamingClient.prototype._areAllCurrent = function(variables, current) {
  for(var i = 0; i < taCounter; i++) {
    if(!this._isCurrent(variables, current, i)) return false;
  }
  return true;
};

StreamingClient.prototype._isCurrent = function(variables, current, variableCount) {
  var initial = this._parseTimeVariable(variables["?initial" + variableCount]);
  var final = this._parseTimeVariable(variables["?final" + variableCount]);
  current = current || new Date().getTime();
  return initial < current && current <= final;
};

StreamingClient.prototype._parseTimeVariable = function(timeVariable) {
  var timeString = timeVariable.replace(/\^\^.*/g, "").replace(/"/g, "");
  return Date.parse(timeString);
};

StreamingClient.prototype._debug = function(callback) {
  debugMode && callback();
};

module.exports = StreamingClient;