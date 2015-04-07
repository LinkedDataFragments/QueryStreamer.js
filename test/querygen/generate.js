#!/usr/bin/env node
/* Parse the results from the proxy measurements to a gnuplot-ready output using stdout. */

var fs  = require('fs'),
    RNG = require('rng');
    
var rng      = new RNG.MT(process.argv[3]),
    vars     = loadVars(["headsign", "platform"]),
    template = fs.readFileSync(process.argv[2], "utf8");

console.log(populate(template, vars));

function loadVars(varnames) {
    vars = {};
    varnames.forEach(function(varname) {
        vars[varname] = fs.readFileSync("data/" + varname + ".variable", "utf8").split("\n");
    });
    return vars;
}

function populate() {
    var newTemplate = template;
    template = "";
    while(newTemplate != template) {
        template = newTemplate
        for(var varname in vars) {
            var values = vars[varname];
            var v = rng.range(0, values.length - 1);
            newTemplate = newTemplate.replace("[" + varname + "]", "\"" + values[v] + "\"");
        }
    }
    return newTemplate;
}