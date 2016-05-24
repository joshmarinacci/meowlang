/**
 * Created by josh on 5/23/16.
 */

/*

basic math with parens for grouping
literals for integer, float, negatives, array, string
comments
calling a function
getting and setting variables
one conditional
one loop
user defined function
 */



/*

implementation plan

block is a list of expressions, returns value of last expression, wrapped in {}
expression is a list of literals, symbols, and sub expressions. reduces to a value
operators: +,-,*,/,==, <=, >=, -> (arrow). operators are methods on type objects
immutable type value objects for Number, Array, String
comments are // to the end of the line

conditional if takes two blocks. second block evaluated if first one is true
    if {5==6} { print(5) }

    technical this is valid too, though it's poor form
    if {print("foo") x==5} {
      print("5 is five")
    }

while take two blocks, second block evaluated while the first one is true, then loops

while { x < 4 } {
   print("still looping")
   x+1 -> x
}

function call is a symbol with parens, expressions are arguments. args are evaluated
before invoking the function

doStuff(4,5,x,"foo",doMore(2))

user defined function, is a name with a scope definition and a block
scope def is a series of symbols (no values)

def myfunc(x,y,z) {
    print(x)
    x + y -> z


}


*/

/* to work, the following code must execute

print("going to print the number 20 " + (4*5))

//print 1 to 5
def x
1 -> x
while {x <= 5} {
   print("value is " + x)
   x+1 -> x
}

//conditional and custom function
def myAdd(x,y) {
   print("doing my function")
   x + y
}

if {x==5} {
   print ("we got to five. good job")
   print ("one more is " + myAdd(x,1))
}

[1,2,3,4,5] -> list
print("this is the list " + list)

//the last statement returns x, which should still be 5
x

*/

/* working to get there
4
4+5 // 9
4*5 // 20
4.5 * 2 // 9

4 * //
5
// returns 20, skips the comment

4<=5 // returns true
4>=5 // returns false
4==4 // returns true
4==5 // returns false

print(4) //returns 4, prints 4
max(4,5) // returns 5

"foo" // returns 'foo'
"foo" + "bar" // foobar
print("foo") // returns 'foo', prints 'foo'


// variables
def x
4 -> x
x*5 // 20

//while
def x
1 -> x
while { x <= 5 } { x+1 => x }
x // returns 5

//iff
def x
5 -> x
if { x > 3 } { 0 => x }
x // returns 0

*/


var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
//var Objects = require('./objects');

//load the grammar
var gram = ohm.grammar(fs.readFileSync('src/grammar3.ohm').toString());
var sem = gram.semantics().addOperation('toList',{
    int: function(a) {
        return parseInt(this.interval.contents,10);
    },
    float: function(a,_,b) {
        return parseFloat(this.interval.contents,10);
    },
    ident: function(a,b) {
        return this.interval.contents;
    },
    AddExpr: function(a,_,b) {  return [a.toList(), 'add', b.toList()];  },
    MulExpr: function(a,_,b) {  return [a.toList(), 'mul', b.toList()]; },
    LtExpr:  function(a,_, b) { return [a.toList(), 'lt',  b.toList()]; },
    LteExpr: function(a,_, b) { return [a.toList(), 'lte', b.toList()]; },
    GtExpr:  function(a,_, b) { return [a.toList(), 'gt',  b.toList()]; },
    GteExpr: function(a,_, b) { return [a.toList(), 'gte', b.toList()]; },
    EqExpr:  function(a,_, b) { return [a.toList(), 'eq',  b.toList()];  },
    NeExpr:  function(a,_, b) { return [a.toList(), 'ne',  b.toList()];  },

    FunCall: function(a,_,b,_) {
        //console.log("got a function call", a.toList());
        //console.log("is iteration",this.isIteration(),this.children);
        //console.log('args = ', args.value);
        return ['funcall', a.toList(), b.toList()];
    },
    Arguments: function(a) {
        //console.log("in args", this.isIteration(), a.isIteration());
        //console.log('a is',a);
        return a.asIteration().toList();
    },
    any: function(_) {
        return this.interval.contents;
    }

});


function test(input, answer) {
    var match = gram.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = sem(match).toList();
    console.log('result = ', result, answer);
    assert.deepEqual(result,answer);
}

//literals
test('4',4);
test('4.5',4.5);

//operators
test('4+5',[4,'add',5]);
test('4*5',[4,'mul',5]);
test('4.5*2',[4.5,'mul',2]);
test('4<5',[4,'lt',5]);
test('4>5',[4,'gt',5]);
test('4<=5',[4,'lte',5]);
test('4>=5',[4,'gte',5]);
test('4==4',[4,'eq',4]);
test('4!=5',[4,'ne',5]);

//comments
test('4 + //6\n 5',[4,'add',5]);

//function calls
test("print(4)",["funcall","print",[4]]); //returns 4, prints 4
test("max(4,5)",["funcall","max",[4,5]]); // returns 5
