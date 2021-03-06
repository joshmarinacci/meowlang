"use strict";

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Scope = require('./ast').Scope;
var MSymbol = require('./ast').MSymbol;

var grammar = ohm.grammar(fs.readFileSync('blog4/grammar.ohm').toString());
var semantics = grammar.createSemantics();

var ASTBuilder = require('./semantics').make(semantics).ASTBuilder;

var GLOBAL = new Scope(null);
GLOBAL.setSymbol(new MSymbol("print"),function(arg1){
    console.log("print:",arg1.val);
    return arg1;
});
GLOBAL.setSymbol(new MSymbol("max"), function(A,B) {
    if(A.val > B.val) return A;
    return B;
});


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


//comments
test('4 + 5  //+ 6',9);

//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");



//native function calls
test("print(4)",4); //returns 4, prints 4
test("max(4,5)",5); // returns 5
test('print("foo") ', 'foo');

// compound tests
// function returns value to math expression
test('6*max(4,5)',30);
test('max(4,5)*6',30);

test('4*max(4,5)',20);
test('4*max(5,4)',20);
// function returns value to function
test('max(4,max(6,5))',6);
test('max(max(6,5),4)',6);



//if statement with native function calls
test("x = 1",1);
test('if { x < 5 } { print("foo") x=x+1 }', 2);
test('if { x > 5 } { 17 } else { 18 }', 18);



//simple user defined function which ignores arguments
test('{ fun addNums()    { 1+2+3+4 } addNums()     }', 10);
test('{ fun addNums(x)   { 1+2+3+4 } addNums()     }', 10);
test('{ fun addNums(x,y) { 1+2+3+4 } addNums(2,3)  }', 10);

// user defined func which uses first arg
test('{ fun plus1(z)   { 1+z } plus1(9) }', 10);
test('{ fun plus1(x)   { 1+x } plus1(9) }', 10);

//user defined func called with variable as arg
test('{ x=5  fun plus1(z)  { 1+z } plus1(x)  }', 6);
test('{ x=5  fun times2(x) { x*2 } times2(x) }', 10);

