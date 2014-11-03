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
};
util.suffixes = {
    "timestamp": "xsd:dateTimeStamp",
}
var statementCounter = 0;

/**
 * Create a triple object.
 */
util.triple = function(subject, predicate, object) {
    return { subject: subject, predicate: predicate, object: object };
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
        util.blankNode(util.prefixes.tmp + "interval", [
            util.blankNode(util.prefixes.tmp + "initial", util.addSuffix(initial, util.suffixes.timestamp)),
            util.blankNode(util.prefixes.tmp + "final", util.addSuffix(final, util.suffixes.timestamp)),
        ]),
    ];
};

/**
 * Writes a blank node to the writer.
 * @param writer N3 writer.
 * @param data A list of blank node data (predicates and objects), ex: [{predicate: "a", object: "b"}]
 *             The object can be a list of blank nodes as well, so nested blank nodes are allowed.
 */
util.writeBlankNode = function(writer, blankNodeData) {
    return util.blankNodeContext(function(label) {
        for(var i = 0; i < blankNodeData.length; i++) {
            var object = blankNodeData[i].object;
            // TODO: request nested blank node support in N3 lib.
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
 * Reify the given triple with time annotation.
 * @param intriple The triple to reify.
 */
util.timeAnnotated = function(intriple) {
    var triples = util.reify(intriple);
    var subject = triples[0].subject;
    triples = triples.concat([
        util.triple(subject, "tmp:interval", "?interval"),
        util.triple("?interval", "tmp:initial", "?initial"),
        util.triple("?interval", "tmp:final", "?final")
    ]);
    return triples;
};

Object.freeze(util);