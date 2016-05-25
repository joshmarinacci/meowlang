/**
 * Created by josh on 5/24/16.
 */


var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Objects = require('./objects');

//load the grammar
var gram = ohm.grammar(fs.readFileSync('src/grammar3.ohm').toString());

var MethodCall = {
    make: function(target, methodName) {
        var obj = { _target: target, type:'MethodCall', _method:methodName};
        Object.setPrototypeOf(obj, MethodCall);
        return obj;
    },
    apply: function(args) {
        var obj = this._target;
        if(obj.type == 'Symbol') obj = obj.getValue();
        var arg = args[0];
        if(arg.type == 'MethodCall') {
            var val = obj[this._method](arg._target);
            arg._target = val;
            return;
        }
        if(arg.type == 'Integer') {
            var val = obj[this._method](arg);
            args[0] = val;
            return;
        }

        if(arg.type == 'String') {
            args[0] = obj[this._method](arg);
            return;
        }
        if(arg.type == 'Symbol') {
            args[0] = obj[this._method](arg);
            return;
        }

        throw new Error("shouldn't be here");
    }
};

var Block = {
    make: function (target) {
        var obj = {_target: target, type: 'Block'};
        Object.setPrototypeOf(obj, Block);
        return obj;
    },
    apply: function() {
        var results = this._target.map(function(result) {
            if(result instanceof Array) return reduceArray(result);
            return result;
        });
        return results.pop();
    }
};

var GLOBAL = {
    print : function (arg) {
        console.log('print:',arg._val);
        return arg;
    },
    max: function(A,B) {
        if(A.greaterThan(B).jsEquals(true)) return A;
        return B;
    }
}

var FunctionCall = {
    make: function(funName, argObj) {
        var obj = { _arg: argObj, type:'FunctionCall', _method:funName};
        Object.setPrototypeOf(obj, FunctionCall);
        return obj;
    },
    apply: function() {
        var mname = this._method;
        return GLOBAL[mname.name].apply(null,this._arg);
    }
};

var WhileLoop = {
    make: function(cond, body) {
        var obj = { cond:cond, body:body, type:'WhileLoop'};
        Object.setPrototypeOf(obj, WhileLoop);
        return obj;
    },
    apply: function() {
        var val = null;
        while(true) {
            var val = this.cond.apply();
            if (val.type != 'Boolean') throw new Error("while condition does not resolve to a boolean!\n" + JSON.stringify(this.cond, null, '  '));
            if (val._val == false) {
                break;
            } else {
                var res = this.body.apply();
            }
        }
        return val;
    }
}

var sem = gram.semantics().addOperation('toAST',{
    int: function(a) {
        return Objects.Integer.make(parseInt(this.interval.contents, 10));
    },
    float: function(a,_,b) {
        return Objects.Float.make(parseFloat(this.interval.contents,10));
    },
    ident: function(a,b) { return Objects.Symbol.make(this.interval.contents,null); },
    str: function(a,text,b) { return Objects.String.make(text.interval.contents); },

    AddExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'add')].concat(b.toAST());
    },
    MulExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'multiply')].concat(b.toAST());
    },
    LtExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'lessThan')].concat(b.toAST());
    },
    LteExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'lessThanEqual')].concat(b.toAST());
    },
    GtExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'greaterThan')].concat(b.toAST());
    },
    GteExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'greaterThanEqual')].concat(b.toAST());
    },
    EqExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'equal')].concat(b.toAST());
    },
    NeExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'notEqual')].concat(b.toAST());
    },
    DefVar: function(_,ident) {
        return ident.toAST();
    },
    FunCall: function(a,_,b,_) {
        return [FunctionCall.make(a.toAST(), b.toAST())];
    },
    Arguments: function(a) {
        return a.asIteration().toAST();
    },
    Block: function(_,b,_) {
        return Block.make(b.toAST());
    },
    AssignExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'assign')].concat(b.toAST());
    },
    WhileExpr: function(_,a,b) {
        return WhileLoop.make(a.toAST(), b.toAST());
    }
});


function reduceArray(arr) {
    if(arr.length == 1) return arr[0];
    arr = arr.slice();
    var first = arr.shift();
    first.apply(arr);
    return reduceArray(arr);
}

function test(input, answer) {
    var match = gram.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = sem(match).toAST();
    //console.log('result = ', JSON.stringify(result,null,' '), answer);
    if(result instanceof Array) {
        result = reduceArray(result);
    }
    if(result.type == 'MethodCall') {
        result = result.apply();
    }
    if(result.type == 'FunctionCall') {
        result = result.apply();
    }
    if(result.type == 'Block') {
        result = result.apply();
        assert(result.jsEquals(answer),true);
        return;
    }
    if(result.type == 'WhileLoop') {
        result = result.apply();
        assert(result.jsEquals(false),true);
        console.log('success',input);
        return;
    }
    if(result.type == 'Symbol') {
        assert.deepEqual(result,answer);
        return;
    }
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
test('x',Objects.Symbol.make("x",null));
test('def x',Objects.Symbol.make('x',null));

test("4 -> x",4);
test('x+5',9);
test('4+5 -> x',9);
test('x+1',10);

//block
test('{ 4+5 5+6 }',11);

//increment
test("1 -> x",1);
test('x+1->x',2);
test('x+1->x',3);

//increment in a block
test("1 -> x",1);
test('{ x+1->x x+1->x}',3);

test("1 -> x",1);
test('while { x <= 5 } { print(x) x+1->x }');

//test the print function inside of a block
//test an if condition with a print function and assignment

/*
test('if { x <= 5 } { x+1 -> x }', ['if',
    ['block',[['@x','lte',5]]],
    ['block',[['@x','add',[1, 'assign', '@x']]]]
]);

//precedence of assignment operator is broken
//precedence of all operators should just be left to right as a list of atoms
*/

