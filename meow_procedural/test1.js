"use strict"
/**
 * Created by josh on 6/4/16.
 */

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var path = require('path');
//var Objects = require('./objects');
//var Semantics = require('./semantics');

/*
procedural version should support creating variables, arithmetic, user defined
functions with parameters using blocks
left right precedence
arrow assignment operator
built in print function
if/then/else using blocks



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

function log() {
    console.log.apply(console,arguments);
}

class MNumber {
    constructor(val) {
        this.val = val;
    }
    resolve(scope) {
        return this;
    }
    jsEquals(jsval) {
        return this.val == jsval;
    }
}

class MBoolean {
    constructor(val) {
        this.val = val;
    }
    resolve(scope) {
        return this;
    }
    jsEquals(jsval) {
        return this.val == jsval;
    }
}

class MString {
    constructor(val) {
        this.val = val;
    }
    resolve(scope) {
        return this;
    }
    jsEquals(jsval) {
        return this.val == jsval;
    }
}

class BinaryOp {
    constructor(op, A, B) {
        this.op = op;
        this.A = A;
        this.B = B;
    }
    resolve(scope) {
        var a = this.A.resolve(scope).val;
        var b = this.B.resolve(scope).val;
        if(this.op == 'add') return new MNumber(a+b);
        if(this.op == 'mul') return new MNumber(a*b);
        if(this.op == 'lt')  return new MBoolean(a<b);
        if(this.op == 'gt')  return new MBoolean(a>b);
        if(this.op == 'lte')  return new MBoolean(a<=b);
        if(this.op == 'gte')  return new MBoolean(a>=b);
        if(this.op == 'eq')  return new MBoolean(a==b);
        if(this.op == 'neq')  return new MBoolean(a!=b);
    }
}


class MScope {
    constructor() {
        this.storage = {};
    }
    makeSubScope() {   return new KLScope()  }
    hasSymbol(name) {  return this.storage[name] }
    setSymbol(name, obj) {  this.storage[name] = obj; return this.storage[name] }
    getSymbol(name) {  return this.storage[name];  }
    dump() {
        console.log("scope: ");
        Object.keys(this.storage).forEach((name) => {
            console.log("   name = ",name, this.storage[name]);
        });
    }
}

class MSymbol {
    constructor(name) {
        this.name = name;
    }
    resolve(scope) {
        log("must resolve from the scope",scope);
        var val =  scope.getSymbol(this.name);
        log("value retrieved is", val);
        return val;
    }
}

class MAssignment {
    constructor(value, sym) {
        this.symbol = sym;
        this.value = value;
    }
    resolve(scope) {
        log("must assign value to name in the scope", this.symbol.name, this.value.resolve(scope));
        return scope.setSymbol(this.symbol.name, this.value.resolve(scope));
    }
}

class MBlock {
    constructor(block) {
        this.statements = block;
    }
    resolve(scope) {
        log("must resolve the expressions",this.statements);
        var vals = this.statements.map(function(expr) {
            log("  must resolve",expr);
            return expr.resolve(scope);
        });
        return vals.pop();
    }
}

var sem = gram.semantics().addOperation('toAST', {
    int: function (a) {
        return new MNumber(parseInt(this.interval.contents, 10));
    },
    float: function (a,_,b) {
        return new MNumber(parseFloat(this.interval.contents, 10));
    },
    str:   function (a, text, b) {
        return new MString(text.interval.contents);
    },

    ident: function (a, b) {
        return new MSymbol(this.interval.contents, null);
    },

    AddExpr: function (a, _, b) {
        return new BinaryOp('add', a.toAST(), b.toAST());
    },
    MulExpr: function (a, _, b) {
        return new BinaryOp('mul', a.toAST(), b.toAST());
    },
    LtExpr: function(a, _, b) {
        return new BinaryOp('lt', a.toAST(), b.toAST());
    },
    GtExpr: function(a, _, b) {
        return new BinaryOp('gt', a.toAST(), b.toAST());
    },
    LteExpr: function(a, _, b) {
        return new BinaryOp('lte', a.toAST(), b.toAST());
    },
    GteExpr: function(a, _, b) {
        return new BinaryOp('gte', a.toAST(), b.toAST());
    },
    EqExpr: function(a, _, b) {
        return new BinaryOp('eq', a.toAST(), b.toAST());
    },
    NeqExpr: function(a, _, b) {
        return new BinaryOp('neq', a.toAST(), b.toAST());
    },
    DefVar: function (_, ident) {
        return ident.toAST();
    },
    AssignExpr: function (a, _, b) {
        return new MAssignment(a.toAST(), b.toAST());
    },

    Block: function(_, body, _1) {
        return new MBlock(body.toAST());
    }
});


var globalScope = new MScope();
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
//test("print(4)",4); //returns 4, prints 4
//test("max(4,5)",5); // returns 5

//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");
//test('print("foo") ', 'foo');

// variables
test('x',null);
test('def x',null);
test("4 -> x",4);
test('x',4);

test('x+5',9);
test('4+5 -> x',9);
test('x+1',10);
//test('print(x)',9);

//block
test('{ 4+5 5+6 }',11);
//test('{ print("inside a block") 66 }',66);

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
return;
test('if { x < 5 } { print("foo") x+1 -> x }', 2);


// compound tests
// function returns value to math expression
test('max(4,5)*6',30);
test('4*max(4,5)',20);
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

