/**
 * The Rewriter module that is only executed once at the start of query execution.
 * It will split up the query into a static and dynamic part while rewriting the dynamic part to be able to extract the
 * time annotation.
 */

var Composer = require('./SparqlComposer.js'),
    util     = require('./RdfUtils.js');
require('js-object-clone');

var debugMode = true;

function Rewriter(ldf, type, target) {
    if (!(this instanceof Rewriter))
        return new Rewriter(ldf, type, target);

  this._ldf       = ldf;
  this._taCounter = 0;
  this._type      = type;
  this._target    = target;
}

Rewriter.prototype._tripleTransformer = function() {
  return {
    reification:         util.timeAnnotatedReification,
    singletonproperties: util.timeAnnotatedSingletonProperties,
    graphs:              util.timeAnnotatedQuads,
  }[this._type];
};

/**
 * Rewrite the given query.
 * @param query The original parsed SPARQL query.
 * @param splitCallback The callback that will return a context.
 * The context will contain:
 *  counter: executed queries counter, starts at 0.
 *  hasTimeAnnotation: If the query has time annotation.
 *  distinct: If the query has a DISTINCT clause.
 *  staticHolder: The static query.
 *  dynamicQuery: The dynamic query.
 *  intersectedVariables: The intersected variables in both queries.
 *  staticStep: If the executor should pass through the static step. If false, this means the static query is empty.
 *  dynamicStep: If the executor should pass through the dynamic step. If false, this means the dynamic query is empty.
 */
Rewriter.prototype.split = function(query, splitCallback) {
  var self = this;
  this.query = this._bNodesToVariables(query);

  this._splitStaticDynamicQuery(this.query.prefixes, this.query.variables, this.query.where, function(staticHolder, dynamicHolder) {
    polishQueryHolder(staticHolder);
    polishQueryHolder(dynamicHolder);

    var intersectedVariables = util.intersection(staticHolder.variables, dynamicHolder.variables);
    var hasTimeAnnotation = !!dynamicHolder.where;

    // Loop over static patterns and move those to the dynamic holder that only have intersected variables.
    self._extractSingularStatic(staticHolder.prefixes, staticHolder.variables, staticHolder.where, intersectedVariables, function (dynamicResult) {
      if (dynamicResult) dynamicHolder = self._appendAllQueryHolders(dynamicHolder, [dynamicResult], false);
    });
    staticHolder.variables = [];
    dynamicHolder.variables = [];
    polishQueryHolder(staticHolder);
    polishQueryHolder(dynamicHolder);

    // It is now possible that the static query is EMPTY, so we indicate whether or not the dynamic results
    // should be passed through the static query executor.
    var reductedVariables = util.reduction(staticHolder.variables, intersectedVariables);
    var staticStep = reductedVariables.length > 0;

    // The dynamic query can also be empty!
    var dynamicStep = dynamicHolder.variables.length > 0;

    var dynamicResult = new Composer(dynamicHolder).compose();

    self._debug(function () {
      console.log("------\nNew query:\n------");
      console.log("Has time annotation? " + (hasTimeAnnotation ? "true" : "false") + "\n");
      console.log("~~~ Dynamic:");
      console.log(dynamicResult);
      console.log("------");
      if (staticStep) {
        console.log("~~~ Static:");
        console.log(new Composer(staticHolder).compose());
        console.log("------");
      } else {
        console.log("~~~ No static step!");
      }
      console.log("\nLive query results:\n------------------------\n");
    });

    var context = {
      counter:              0,
      hasTimeAnnotation:    hasTimeAnnotation,
      distinct:             self.query.distinct,
      staticHolder:         staticHolder,
      dynamicQuery:         dynamicResult,
      intersectedVariables: intersectedVariables,
      staticStep:           staticStep,
      dynamicStep:          dynamicStep,
    };

    splitCallback(context);
  });

  /**
   * Prepare the query holder to be composed into an actual SPARQL query.
   */
  function polishQueryHolder(queryHolder) {
    queryHolder.type = 'query';
    queryHolder.queryType = 'SELECT';

    // Some steps could have introduced patterns that are simply false because we could not remove them from the array
    // at that moment, so we remove them now.
    var newWhere = [];
    queryHolder.where.forEach(function(el) {
      if(el) newWhere.push(el);
    });
    queryHolder.where = newWhere;

    // These will not become visible to the user, but is required to make query splitting work.
    self._appendAllVariables(queryHolder.variables, queryHolder.where);

    queryHolder.variables = Object.keys(queryHolder.variables);
  }
};

/**
 * Convert all blank nodes to variables in the given query.
 * Only the WHERE clause will be changed, no new variables will be added to SELECT.
 * Collisions with already existing variables will be avoided.
 */
Rewriter.prototype._bNodesToVariables = function(query) {
  var newQuery = Object.clone(query, true);
  newQuery.variables = {};
  this._appendAllVariables(newQuery.variables, newQuery.where);
  var convertedVariables = Object.clone(newQuery.variables, true);
  this._bNodesToVariablesInner(newQuery.variables, convertedVariables, newQuery.where);
  newQuery.variables = Object.keys(newQuery.variables);
  return newQuery;
};

/**
 * Split up a query into a dynamic and static part.
 * @param prefixes The accumulated prefixes
 * @param variables The accumulated variables
 * @param where The input query part.
 * @param resultsCallback Callback with the resulting static and dynamic queries.
 */
Rewriter.prototype._splitStaticDynamicQuery = function(prefixes, variables, where, resultsCallback) {
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
          resultsCallback(self._flattenQueryHolders(resultStaticQuery), self._flattenQueryHolders(resultDynamicQuery));
        }
      });
    }
  } else if(where.type == "bgp") {
    this._splitStaticDynamicQuery(prefixes, variables, where.triples, function(staticHolder, dynamicHolder) {
      resultStaticQuery  = self._initQueryHolder(where),
      resultDynamicQuery = self._initQueryHolder(where);
      self._appendAllQueryHolders(resultStaticQuery, [staticHolder], true);
      self._appendAllQueryHolders(resultDynamicQuery, [dynamicHolder], true);
      resultStaticQuery.where.triples  = staticHolder.where;
      resultDynamicQuery.where.triples = dynamicHolder.where;
      resultsCallback(resultStaticQuery, resultDynamicQuery);
    });
  } else if(where.type == "union") {
    this._splitStaticDynamicQuery(prefixes, variables, where.patterns, function(staticHolder, dynamicHolder) {
      resultStaticQuery  = self._initQueryHolder(where),
      resultDynamicQuery = self._initQueryHolder(where);
      if(dynamicHolder.where.length == 0) {
        self._appendAllQueryHolders(resultStaticQuery, [staticHolder], true);
        resultStaticQuery.where.patterns = staticHolder;
      } else if(staticHolder.where.length == 0) {
        self._appendAllQueryHolders(resultDynamicQuery, [dynamicHolder], true);
        resultDynamicQuery.where.patterns = dynamicHolder;
      } else {
        // In this case we have a mixed union of static and dynamic parts
        // IMPOSSIBLE to have disjoint static and dynamic parts, so we will put everything inside the dynamic part.
        // Note that optimisations for this case are very likely! (For example when only ONE union-group with mixed
        // static/dynamic parts after some transformations to make sure that the union part is last in the query)
        // TODO: test this!
        self._appendAllQueryHolders(resultDynamicQuery, [staticHolder, dynamicHolder], true);
        resultDynamicQuery.where.patterns = self._flattenQueryHolders([staticHolder, dynamicHolder]);
      }
      resultsCallback(resultStaticQuery, resultDynamicQuery);
    });
  } else {
    this._shouldTransform(prefixes, variables, where, function(shouldTransform) {
      var resultStaticQuery  = self._initQueryHolder(),
          resultDynamicQuery = self._initQueryHolder();
      if(shouldTransform) {
        var modified = self._tripleTransformer()(where, function() {
          resultDynamicQuery.variables["?initial" + self._taCounter] = true;
          resultDynamicQuery.variables["?final" + self._taCounter]   = true;
          resultDynamicQuery.prefixes["tmp"] = util.prefixes.tmp;
          resultDynamicQuery.prefixes["sp"]  = util.prefixes.sp;
          return self._taCounter++;
        });
        self._appendQueryPart(resultDynamicQuery, modified, prefixes, variables);
      } else {
        self._appendQueryPart(resultStaticQuery, where, prefixes, variables);
      }
      resultsCallback(resultStaticQuery, resultDynamicQuery);
    });
  }
};

/**
 * Private function for the blank node to variable conversion.
 * @param originalVariables The original variables, immutable.
 * @param originalAndNewVariables The original and newly generated variables, mutable. This acts also as output.
 * @param queryPart The mutable WHERE clause of the query, also acts as output.
 */
Rewriter.prototype._bNodesToVariablesInner = function(originalVariables, originalAndNewVariables, queryPart) {
  var self = this;
  if(queryPart instanceof Array) {
    queryPart.forEach(function(el) { self._bNodesToVariablesInner(originalVariables, originalAndNewVariables, el); });
  } else if(queryPart.type == "bgp") {
    this._bNodesToVariablesInner(originalVariables, originalAndNewVariables, queryPart.triples);
  } else if(queryPart.type == "union") {
    this._bNodesToVariablesInner(originalVariables, originalAndNewVariables, queryPart.patterns);
  } else {
    util.fields.forEach(function(field) {
      if(util.isBlankNode(queryPart[field])) {
        var variable,
          attempCounter = 0;
        // This loop is required to avoid collisions with existing variables.
        while(originalVariables[variable = '?' + queryPart[field].substr(2, queryPart[field].length) + attempCounter++]);
        queryPart[field] = variable;
        originalAndNewVariables[variable] = true;
      }
    });
  }
};

/**
 * Append all variables to the variables array from the WHERE clause that are not in that array yet.
 */
Rewriter.prototype._appendAllVariables = function(variables, queryPart) {
  var self = this;
  if(queryPart instanceof Array) {
    queryPart.forEach(function(el) { self._appendAllVariables(variables, el); });
  } else if(queryPart.type == "bgp") {
    this._appendAllVariables(variables, queryPart.triples);
  } else if(queryPart.type == "union") {
    this._appendAllVariables(variables, queryPart.patterns);
  } else {
    util.fields.forEach(function(field) {
      if(util.isVariable(queryPart[field])) variables[queryPart[field]] = true;
    });
  }
};

/**
 * Extract the static patterns that only have intersected variables and move them to the dynamic holder which will be
 * returned in the callback.
 */
Rewriter.prototype._extractSingularStatic = function(prefixes, variables, where, intersectedVariables, resultsCallback) {
  var resultDynamicQuery,
      self = this;
  if(where instanceof Array) {
    resultDynamicQuery = [];
    var called = 0;
    for(var i = 0; i < where.length; i++) {
      this._extractSingularStatic(prefixes, variables, where[i], intersectedVariables, function(dynamicHolder) {
        called++;
        if(dynamicHolder.where && (!Array.isArray(dynamicHolder.where) || dynamicHolder.where.length > 0)) {
          // Remove query part from the static query.
          where[i] = false;
          // And then add it to the dynamic query.
          resultDynamicQuery.push(dynamicHolder);
        }
        if(called == where.length) { // If at the end of the loop
          resultsCallback(self._flattenQueryHolders(resultDynamicQuery));
        }
      });
    }
  } else if(where.type == "bgp") {
    this._extractSingularStatic(prefixes, variables, where.triples, intersectedVariables, function(dynamicHolder) {
      resultDynamicQuery = self._initQueryHolder();
      if(dynamicHolder) resultDynamicQuery.where = [];
      self._appendAllQueryHolders(resultDynamicQuery, [dynamicHolder], false);
      resultDynamicQuery.where.triples = dynamicHolder.where;
      resultsCallback(resultDynamicQuery);
    });
  } else if(where.type == "union") {
    this._extractSingularStatic(prefixes, variables, where.patterns, intersectedVariables, function(dynamicHolder) {
      resultDynamicQuery = self._initQueryHolder();
      if(dynamicHolder) resultDynamicQuery.where = [];
      self._appendAllQueryHolders(resultDynamicQuery, [dynamicHolder], false);
      resultDynamicQuery.where.patterns = self._flattenQueryHolders([dynamicHolder]);
      resultsCallback(resultDynamicQuery);
    });
  } else {
    var shouldExtract = true;
    util.fields.forEach(function(field) {
      if(util.isVariable(where[field]) && intersectedVariables.indexOf(where[field]) < 0) shouldExtract = false;
    });
    if(shouldExtract) {
      resultDynamicQuery = self._initQueryHolder();
      self._appendQueryPart(resultDynamicQuery, where, prefixes, variables);
      resultsCallback(resultDynamicQuery);
    } else {
      resultsCallback(false);
    }
  }
};

Rewriter.prototype._flatten = function(array) { return [].concat.apply([], array); };

/**
 * Create a new simple query holder.
 * @param where Optional parameter that will be deep-cloned and used as where clause, otherwise where will be false.
 */
Rewriter.prototype._initQueryHolder = function(where) {
  return {
    variables: {},
    prefixes: {},
    where: where ? Object.clone(where, true) : false
  };
};

/**
 * Append data to the given query holder.
 */
Rewriter.prototype._appendQueryPart = function(queryHolder, where, prefixes, variables) {
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
      var shouldAdd = util.fields.reduce(function (acc, field) {
        return acc || (variable == where[field]);
      }, false);
      if (shouldAdd) {
        queryHolder.variables[variable] = true;
      }
    });

    // Copy used prefixes
    Object.keys(prefixes).forEach(function (prefix) {
      var shouldAdd = util.fields.reduce(function (acc, field) {
        return acc || (where[field].indexOf(prefix) == 0);
      });
      if (shouldAdd) {
        queryHolder.prefixes[prefix] = prefixes[prefix];
      }
    });
  }
};

/**
 * Merges a list of query holders into one query holder with a list as where clause.
 */
Rewriter.prototype._flattenQueryHolders = function(queryHolders) {
  var queryHolder = this._initQueryHolder();
  queryHolder.where = [];
  return this._appendAllQueryHolders(queryHolder, queryHolders);
};

/**
 * Append a list of query holders to one query holder where the concatenation of the where clause
 * can be skipped if skipQueryPart is true.
 */
Rewriter.prototype._appendAllQueryHolders = function(queryHolder, queryHolders, skipQueryPart) {
  var self = this;
  queryHolders.forEach(function(qHolder) {
    queryHolder.variables = util.concatMap(queryHolder.variables, qHolder.variables);
    queryHolder.prefixes  = util.concatMap(queryHolder.prefixes,  qHolder.prefixes);
    if(!skipQueryPart) queryHolder.where = queryHolder.where.concat(qHolder.where);
  });
  return queryHolder;
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
Rewriter.prototype._executeTransformation = function(prefixes, variables, queryPart, resultsCallback) {
  var result,
      self = this;
  if(queryPart instanceof Array) {
    result = [];
    var bufferHasTimeAnnotation = false;
    for(var i = 0; i < queryPart.length; i++) {
      this._executeTransformation(prefixes, variables, queryPart[i], function(modifiedQueryPart, hasTimeAnnotation) {
        result.push(modifiedQueryPart);
        bufferHasTimeAnnotation = hasTimeAnnotation | bufferHasTimeAnnotation;
        if(result.length == queryPart.length) { // If at the end of the loop
          resultsCallback(self._flatten(result), bufferHasTimeAnnotation);
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
        var modified = self._tripleTransformer()(queryPart, function() {
          variables.push("?initial" + self._taCounter);
          variables.push("?final" + self._taCounter);
          return self._taCounter++;
        });
        resultsCallback(modified, true);
      } else {
        resultsCallback(queryPart, false);
      }
    });
  }
};

/**
 * Copy all properties from the source to the self object.
 */
Rewriter.prototype._extendObject = function(self, source) {
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
Rewriter.prototype._shouldTransform = function(prefixes, variables, triple, callback) {
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
        "triples": this._tripleTransformer()(triple),
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
Rewriter.prototype._isQueryNotEmpty = function(subQuery, callback) {
  this.fragmentsClient = new this._ldf.FragmentsClient(this._target);
  var results = new this._ldf.SparqlIterator(subQuery, { fragmentsClient: this.fragmentsClient });
  var shouldCall = true;
  results.on('data', function (row) {
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

Rewriter.prototype._debug = function(callback) {
  debugMode && callback();
};

module.exports = Rewriter;