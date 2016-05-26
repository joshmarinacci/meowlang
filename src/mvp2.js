/**
 * Created by josh on 5/24/16.
 */
/*
* rewrite evaluation system
* every node has an apply method
* this method never changes state of the node, it only returns new content
*    so that we can evaluate a node over and over with no changes
* add tests that involve variable resolution and calling functions as args to functions
* a function/method only gets the first argument of the array. if you want
* multiple arguments then you have to use parenthesis
* add tests that use parenthensis for grouping
*
* symbol.apply returns the current value of the symbol
* methodcall.apply evals the arguments, then executes the method call, returns the result
* block.apply executes every expression in the block, return result of last expression
* functioncall.apply evals the arguments, then executes the function call, returns the result.
* while loop applys the condition block each time through the loop, and the body block each time. returns last result of the body
* if loop applies the condition once, applies the body once, returns value of the body
* i should be able to get rid of reduce array
*
* what will the AST look like for chained methods vs explicit methods
* fold function calls and method calls into one? methods on a global object?
*
*
* down to 415 lines of code
*/

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Objects = require('./objects');
var Semantics = require('./semantics');

//load the grammar
var gram = ohm.grammar(fs.readFileSync('src/grammar3.ohm').toString());

var sem = Semantics.load(gram);

function test(input, answer) {
    var match = gram.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = sem(match).toAST();
    //console.log('result = ', JSON.stringify(result,null,' '), answer);
    if(result instanceof Array) result = Objects.reduceArray(result);
    if(result.apply) result = result.apply();
    if(result == null && answer == null) return console.log('success',input);
    assert(result.jsEquals(answer),true);
    console.log('success',input);
}

//literals
test('4',4);
test('4.5',4.5);

//operators
test('4+5',9);
test('4*5',20);
test('4.5*2',9);
test('4+5+6+7',15+7);
test('4<5',true);
test('4>5',false);
test('4<=5',true);
test('4>=5',false);
test('4==4',true);
test('4!=5',true);

//precedence tests
test('4*5+2',22);
test('4+5*2',18);

//comments
test('4 + //6\n 5',9);

//function calls
test("print(4)",4); //returns 4, prints 4
test("max(4,5)",5); // returns 5

//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");
test('print("foo") ', 'foo');

// variables
test('x',null);
test('def x',null);

test("4 -> x",4);
test('x+5',9);
test('4+5 -> x',9);
test('x+1',10);
test('print(x)',9);


//block
test('{ 4+5 5+6 }',11);
test('{ print("inside a block") 66 }',66);

//increment
test("1 -> x",1);
test('x+1->x',2);
test('x+1->x',3);

//increment in a block
test("1 -> x",1);
test('{ x+1->x x+1->x}',3);
test('{ x+1->x x+1->x}',5);
test("1 -> x",1);

//while should return the last result of the body block
test('while { x <= 5 } { print(x) x+1->x }',8);
//test the print function inside of a block
//test an if condition with a print function and assignment

test("1 -> x",1);
test('if { x < 5 } { print("foo") x+1 -> x }', 2);


return;
// compound tests
// function returns value to math expression
test('max(4,5)*4',20);
test('4*max(4,5)',20);
// function returns value to function
test('max(4,max(6,5))',6);
test('max(max(6,5),4)',6);