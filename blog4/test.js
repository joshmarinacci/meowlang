"use strict";

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Scope = require('./ast').Scope;

var grammar = ohm.grammar(fs.readFileSync('blog4/grammar.ohm').toString());
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


//while loop
test('{ x=0  while { x < 5 } { x = x+1 } } ',5);
test('{ x=4  while { x < 5 } { x = x+1 } } ',5);
test('{ x=8  while { x < 5 } { x = x+1 } } ',null);

/*
//comments
test('4 + //6\n 5',9);

//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");
test('print("foo") ', 'foo');
*/

/*
//native function calls
test("print(4)",4); //returns 4, prints 4
test("max(4,5)",5); // returns 5

// compound tests
// function returns value to math expression
test('max(4,5)*6',30);
test('4*max(4,5)',20);
test('4*max(5,4)',20);
// function returns value to function
test('max(4,max(6,5))',6);
test('max(max(6,5),4)',6);

*/

/*
//if statement with native function calls
test("1 -> x",1);
test('if { x < 5 } { print("foo") x+1 -> x }', 2);
test('if { x > 5 } { 17 } else { 18 }', 18);
*/

/*
//simple user defined function which ignores arguments
test('{ def myFun()    { 1+2+3+4 } myFun()     }', 10);
test('{ def myFun(x)   { 1+2+3+4 } myFun()     }', 10);
test('{ def myFun(x,y) { 1+2+3+4 } myFun(2,3)  }', 10);

// user defined func which uses first arg
test('{ def myFun(z)   { 1+z } myFun(9) }', 10);
test('{ def myFun(x)   { 1+x } myFun(9) }', 10);

//user defined func called with variable as arg
test('{ x=5  def myFun(z)   { 1+z } myFun(x) }', 6);
test('{ x=5  def myFun(x)   { x*2 } myFun(x) }', 10);
*/

