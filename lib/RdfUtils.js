var N3 = require('n3');

/**
 * Utility functions for working with URIs, triples, variables, and patterns.
 * @exports RdfUtil
 * @extends N3.Util
 */
var util = module.exports = N3.Util({});

util.prefixes = {
    "rdf":  "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "t":    "http://example.org/tracks#",
    "a":    "http://example.org/artists#",
    "m":    "http://example.org/music#",
    "radio":"http://example.org/radios#",
    "tmp":  "http://example.org/temporal#",
    "sp":  "http://example.org/singletonproperties#",
    "graphs":  "http://example.org/graphs#",
    "train":"http://example.org/train#",
    "departure": "http://irail.be/stations/NMBS/008892007/departures/",
    "stop": "http://irail.be/stations/NMBS/",
};
util.suffixes = {
    "timestamp": "xsd:dateTimeStamp",
};
util.fields = ["subject", "predicate", "object", "context"];
var statementCounter = 0;
var spStatementCounter = 0;

/**
 * Check if the given field is a variable.
 */
util.isVariable = function(field) {
  return field && field.charAt(0) == '?';
};

/**
 * Check if the given field is a blank node.
 */
util.isBlankNode = function(field) {
  return field && field.charAt(0) == '_';
};

/**
 * Create a triple object.
 */
util.triple = function(subject, predicate, object) {
    return { subject: subject, predicate: predicate, object: object };
};

/**
 * Create a quad object.
 */
util.quad = function(subject, predicate, object, context) {
  return { subject: subject, predicate: predicate, object: object, context: context };
};

/**
 * Create a blank node object. Triple object without subject.
 */
util.blankNode = function(predicate, object) {
    return { predicate: predicate, object: object };
};

/**
 * Add a suffix to an object to make it a literal.
 */
util.addSuffix = function(object, suffix) {
    return "\"" + object + "\"^^" + suffix;
};

/**
 * Create a new blank node label.
 * @param callback A callback function that takes a label as argument.
 * @returns {string} The created label
 */
util.blankNodeContext = function(callback) {
    var label = "_:stmt" + statementCounter++;
    callback && callback(label);
    return label;
};

/**
 * Create annotation parameters for a time-interval.
 */
util.createInterval = function(initial, final) {
    return [
        util.blankNode(util.prefixes.tmp + "intervalInitial", util.addSuffix(initial, util.suffixes.timestamp)),
        util.blankNode(util.prefixes.tmp + "intervalFinal", util.addSuffix(final, util.suffixes.timestamp)),
    ];
};

/**
 * Writes a blank node to the writer.
 * @param writer N3 writer.
 * @param blankNodeData A list of blank node data (predicates and objects), ex: [{predicate: "a", object: "b"}]
 *                      The object can be a list of blank nodes as well, so nested blank nodes are allowed.
 * @param customLabel An optional custom label for the subjects.
 */
util.writeBlankNode = function(writer, blankNodeData, customLabel) {
    return util.blankNodeContext(function(label) {
        label = customLabel || label;
        for(var i = 0; i < blankNodeData.length; i++) {
            var object = blankNodeData[i].object;
            if(object instanceof Array && object.length > 0) {
                object = util.writeBlankNode(writer, object);
            }
            writer.addTriple(util.triple(label, blankNodeData[i].predicate, object));
        }
    });
};

/**
 * Reify the given triple and write it to the writer.
 * @param writer The writer.
 * @param intriple The triple to reify.
 * @param params An optional list of blank nodes to add as annotations.
 */
util.writeReification = function(writer, intriple, params) {
    util.writeBlankNode(writer, util.reifyBlank(intriple).concat(params || []));
};

/**
 * Reify the given triple without a subject.
 * @param intriple The triple to reify.
 */
util.reifyBlank = function(intriple) {
    return [
        util.blankNode(util.prefixes.rdf + "subject", intriple.subject),
        util.blankNode(util.prefixes.rdf + "predicate", intriple.predicate),
        util.blankNode(util.prefixes.rdf + "object", intriple.object),
    ];
};

/**
 * Reify the given triple.
 * @param intriple The triple to reify.
 */
util.reify = function(intriple) {
    var label = util.blankNodeContext();
    return [
        util.triple(label, util.prefixes.rdf + "subject", intriple.subject),
        util.triple(label, util.prefixes.rdf + "predicate", intriple.predicate),
        util.triple(label, util.prefixes.rdf + "object", intriple.object),
    ];
};

/**
 * Transform the given triple to a singleton properties equivalent.
 * @param intriple The triple to transform.
 */
util.makeSingletonProperty = function(intriple) {
    var label = "?sp" + spStatementCounter++;
    return [
        util.triple(label, util.prefixes.sp + "singletonPropertyOf", intriple.predicate),
        util.triple(intriple.subject, label, intriple.object),
    ];
};

/**
 * Time annotate the given triple(s), first triple subject will be taken as label.
 * @param triples The input triples to append to.
 * @param customSubject An optional subject instead of the one from the first triple.
 * @param taCounterCallback An optional callback for determining a suffix for the initial and final variables
 * @returns The accumulated triples
 */
util.timeAnnotate = function(triples, customSubject, taCounterCallback) {
    var subject = customSubject || triples[0].subject;
    var varSuffix = taCounterCallback ? taCounterCallback() : "";
    triples = triples.concat([
        util.triple(subject, "tmp:intervalInitial", "?initial" + varSuffix),
        util.triple(subject, "tmp:intervalFinal", "?final" + varSuffix)
    ]);
    return triples;
};

/**
 * Reify the given triple with time annotation.
 * @param intriple The triple to reify.
 * @param taCounterCallback An optional callback for determining a suffix for the initial and final variables
 */
util.timeAnnotatedReification = function(intriple, taCounterCallback) {
    return util.timeAnnotate(util.reify(intriple), false, taCounterCallback);
};

/**
 * Transform the given triple to singleton properties with time annotation.
 * @param intriple The triple to transform.
 * @param taCounterCallback An optional callback for determining a suffix for the initial and final variables
 */
util.timeAnnotatedSingletonProperties = function(intriple, taCounterCallback) {
    return util.timeAnnotate(util.makeSingletonProperty(intriple), false, taCounterCallback);
};

/**
 * Transform the given triple to a quad with time annotation.
 * @param intriple The triple to transform.
 * @param taCounterCallback An optional callback for determining a suffix for the initial and final variables
 */
util.timeAnnotatedQuads = function(intriple, taCounterCallback) {
  var label = util.blankNodeContext();
  label = "?" + label.substr(2, label.length);
  return util.timeAnnotate([util.quad(intriple.subject, intriple.predicate, intriple.object, label)], label, taCounterCallback);
};

/**
 * Find the intersection of two arrays.
 * Arrays are not sorted, so the complexity is be O(n^2)
 * Arrays are assumed to be sets.
 * @param array1
 * @param array2
 * @returns {Array}
 */
util.intersection = function(array1, array2) {
  var newArray = [];
  array1.forEach(function(el1) {
    array2.forEach(function(el2) {
      if(el1 == el2) newArray.push(el1);
    });
  });
  return newArray;
};

Object.freeze(util);