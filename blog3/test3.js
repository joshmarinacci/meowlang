/**
 * Created by josh on 5/27/16.
 */

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var grammar = ohm.grammar(fs.readFileSync('blog3/ini.ohm').toString());

var IniParser = grammar.createSemantics().addOperation('parse', {
    comment: function(a,b,c) {
        return b.parse().join("");
    },
    keypair: function(key, _, value, eol) {
        return {
            key: key.parse().join(""),
            value: value.parse().join("")
        }
    },
    section: function(a,b,c) {
        return { type:"section", name:b.parse().join("") };
    },
    _terminal: function() { return this.primitiveValue; }
});


function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = IniParser(match).parse();
    console.log('success = ', result, answer);
    assert.deepEqual(result,answer);
}

test(";foo\n","foo");
test("foo=bar\n",{key:'foo',value:'bar'});
test("[some stuff]",{ type:"section", name:"some stuff"});
