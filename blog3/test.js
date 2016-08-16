"use strict";

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Scope = require('./ast').Scope;

var grammar = ohm.grammar(fs.readFileSync('blog3/grammar.ohm').toString());
var semantics = grammar.createSemantics();

var ASTBuilder = require('./semantics').make(semantics).ASTBuilder;

var GLOBAL = new Scope(null);

function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var ast = ASTBuilder(match).toAST();
    var result = ast.resolve(GLOBAL);
    console.log('result = ', result);
    try {
        assert.deepEqual(result.jsEquals(answer), true);
        console.log('success = ', result, answer);
    } catch(e) {
        console.log(e);
    }
}

test('4+5*10',90);
test('4*5+10',30);

// math
test('(4+5)*10',90);
test('4+(5*10)',54);
test('10',10);

// symbols
test('x = 10',10);
test('x',10);
test('x * 2',20);
test('x = 10+10',20);
test('x = 10+10',20);

// boolean expressions
test('4==4',true);
test('4!=5',true);
test('4<5',true);
test('4>5',false);
test('4<=5',true);
test('4>=5',false);

//block
test('{4 5}',5);

//if then else
test('if{4==2+2}{1}',1);
test('if{4==2+2}{1}else{2}',1);
test('if{4==2+3}{1}else{2}',2);