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
    assert.deepEqual(result.jsEquals(answer),true);
    console.log('success = ', result, answer);
}

test('4+5*10',4+5*10);
test('10',10);
test('x = 10',10);
test('x',10);
test('x * 2',20);
