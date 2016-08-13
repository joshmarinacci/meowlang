/**
 * Created by josh on 5/27/16.
 */

/**
 * Created by josh on 5/27/16.
 *
 */


var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var grammar = ohm.grammar(fs.readFileSync('blog2/coolcalc.ohm').toString());

var Calculator = grammar.createSemantics().addOperation('calc', {
    AddExpr: function(a) {
        return a.calc();
    },
    AddExpr_plus: function(a,_,b) {
        return a.calc() + b.calc();
    },
    AddExpr_minus: function(a,_,b) {
        return a.calc() - b.calc();
    },
    MulExpr: function(a) {
        return a.calc();
    },
    MulExpr_times: function(a,_,b) {
        return a.calc() * b.calc();
    },
    MulExpr_divide: function(a,_,b) {
        return a.calc() / b.calc();
    },
    PriExpr_paren: function(_,a,_) {
        return a.calc();
    },


    int: function(a) {
        return parseInt(this.sourceString,10);
    },
    float: function(a,b,c,d) {
        return parseFloat(this.this.sourceString);
    },
    hex: function(a,b) {
        return parseInt(this.this.sourceString.substring(2),16);
    },
    oct: function(a,b) {
        return parseInt(this.this.sourceString.substring(2),8);
    }
});


function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = Calculator(match).calc();
    assert.deepEqual(result,answer);
    console.log('success = ', result, answer);
}

//test("1+2",3);
//test("1-2",-1);
//test("4*5",20);
//test('4/5',4/5);

//test('1*(2+3)',1*(2+3));
//test('(1*2)+3',(1*2)+3);
test('2*3+4', 2*3+4);
test('4+3*2', 4+3*2);
test('(4+3)*2',(4+3)*2);
test('4/5',4/5);
test('4-5',4-5);
//test('1  * 2 + 3  ', 1*2+3);
