"use strict"
/**
 * Created by josh on 6/4/16.
 */

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var path = require('path');
var MObjects = require('./objects');
var Semantics = require('./semantics');

/*
//multiply the arguments
def times(x,y,z) {
    return x * y * z
}

//recursive definition of factorial
def factorial(n) {
   if(n == 1) {
     1
   } else {
     factorial(n-1)*n
   }
}

print("times of 1,2, and 3 is ", sum(1,2,3))

def x;
x = 3;
print("factorial of 3 is",factorial(x))

under 200 lines of code, is this possible?
eliminate extra conditionals and the math we don't use?
*/

//load the grammar
var gram = ohm.grammar(fs.readFileSync(path.join(__dirname,'grammar.ohm')).toString());

var globalScope = new MObjects.Scope();
globalScope.setSymbol("print",function(arg1){
    console.log("print:",arg1);
    return arg1;
});
globalScope.setSymbol("max", function(A,B) {
    if(A.val > B.val) return A;
    return B;
});

var sem = Semantics.load(gram);
function test(input, answer) {
    var match = gram.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = sem(match).toAST();
    //console.log('result = ', JSON.stringify(result,null,' '), answer);
    result = result.resolve(globalScope);
    //console.log('resolved = ', JSON.stringify(result,null,' '), answer);
    ///if(result.apply) result = result.apply(Objects.GlobalScope);
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
test('4+5+6+7',4+5+6+7);
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
test('x',4);

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
//test('while { x <= 5 } { print(x) x+1->x }',6);
//test the print function inside of a block
//test an if condition with a print function and assignment

test("1 -> x",1);
test('if { x < 5 } { print("foo") x+1 -> x }', 2);
test('if { x > 5 } { 17 } else { 18 }', 18);


// compound tests
// function returns value to math expression
test('max(4,5)*6',30);
test('4*max(4,5)',20);
test('4*max(5,4)',20);
// function returns value to function
test('max(4,max(6,5))',6);
test('max(max(6,5),4)',6);

test('{ def myFun()    { 1+2+3+4 } myFun()  }', 10);
test('{ def myFun(x)   { 1+2+3+4 } myFun()  }', 10);
test('{ def myFun(x,y) { 1+2+3+4 } myFun(2,3)  }', 10);


test('{ def myFun(z)   { 1+z } myFun(9) }', 10);
test('{ def myFun(x)   { 1+x } myFun(9) }', 10);
test('{ def myFun(x,y) { 1+2+3+4 } myFun(2,3) }',10);
test('{ def myFun(x,y) { print("foo") x } myFun(2,3) }',2);
test('{ def myFun(x,y) { print("foo") x+y } myFun(4,6) }',10);

