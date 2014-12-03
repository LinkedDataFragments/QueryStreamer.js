var N3 = require('n3');

function Composer(data) {
    if (!(this instanceof Composer))
        return new Composer(data);

    this.jsonData = data;
}

Composer.prototype.compose = function() {
    var data = this.jsonData;
    var output = "";
    data.prefixes["rdf"] = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    var writer = new N3.Writer(data.prefixes);
    for(var prefix in data.prefixes) {
        if (data.prefixes.hasOwnProperty(prefix)) {
            output += "PREFIX " + prefix + ": <" + data.prefixes[prefix] + ">\n";
        }
    }
    var self = this;
    writer.end(function (error, result) { output += self._modifyParseResult(result); });

    output += "\n";
    output += data.queryType;
    for(var i = 0; i < data.variables.length; i++) {
        output += " " + data.variables[i]
    }
    output += "\n";
    output += "WHERE {";

    output = this._writeRecursive(output, data.where, data.prefixes);

    output += "\n}";
    return output;
};

Composer.prototype._modifyParseResult = function (result) {
    var lines = result.split("\n");
    var res = "";
    for(var i = 0; i < lines.length; i++) {
        if(lines[i].length > 0 && lines[i].charAt(0) != '@') {
          res += lines[i].split(" ").map(function(el) {
            if(el.charAt(1) == '<') {
              el = el.replace(/<</, "<");
              el = el.replace(/>>/, ">");

            } else {
              el = el.replace(/[<>]/g, "");
            }
            return el;
          }).join(" ");
        }
    }
    return res;
};

Composer.prototype._writeRecursive = function(output, data, prefixes, indent) {
    indent = indent || "  ";
    if(data instanceof Array) {
        for(var i = 0; i < data.length; i++) {
            output = this._writeRecursive(output, data[i], prefixes, indent);
        }
    } else if(data.hasOwnProperty('type') && data.type == "bgp") {
        output = this._writeRecursive(output, data.triples, prefixes, indent);
    } else if(data.hasOwnProperty('type') && data.type == "union") {
        output += "\n" + indent + "{";
        for(var i = 0; i < data.patterns.length; i++) {
            output = this._writeRecursive(output, data.patterns[i], prefixes, indent + "  ");
            if(i == data.patterns.length - 1) {
                output += "\n" + indent + "}";
            } else {
                output += "\n" + indent + "} UNION {";
            }
        }
    } else {
        var writer = new N3.Writer(prefixes);
        writer.addTriple(data);
        var shouldAddGraph = data.context;
        var self = this;
        writer.end(function (error, result) {
          if(shouldAddGraph) {
            output += "\n" + indent + "GRAPH " + data.context + " {";
            output += "\n" + indent + "  " + self._modifyParseResult(result);
            output += "\n" + indent + "}";
          } else {
            output += "\n" + indent + self._modifyParseResult(result);
          }

        });
    }

    return output;
};

module.exports = Composer;