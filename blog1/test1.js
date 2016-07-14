/**
 * Created by josh on 5/27/16.
 *
*/


var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var grammar = ohm.grammar(fs.readFileSync('blog1/grammar.ohm').toString());

var toJS = grammar.semantics().addOperation('toJS', {
    Number: function(a) {
        return a.toJS();
    },
    int: function(a) {
        console.log("doing int", this.interval.contents);
        return parseInt(this.interval.contents,10);
    },
    float: function(a,b,c,d) {
        console.log("doing float", this.interval.contents);
        return parseFloat(this.interval.contents);
    },
    hex: function(a,b) {
        console.log("doing hex", this.interval.contents);
        return parseInt(this.interval.contents.substring(2),16);
    },
    oct: function(a,b) {
        console.log("doing octal", this.interval.contents.substring(2));
        return parseInt(this.interval.contents.substring(2),8);
    }
});


function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = toJS(match).toJS();
    assert.deepEqual(result,answer);
    console.log('success = ', result, answer);
}

test("123",123);
test("999",999);
//test("abc",999);
test('123.456',123.456);
test('0.123',0.123);
//test('.123',0.123);
test('0x456',0x456);
test('0xFF',255);
test('4.8e10',4.8e10);
test('4.8e-10',4.8e-10);

test('0o77',7*8+7);
test('0o23',0o23);
