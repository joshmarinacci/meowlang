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

        throw new Error("shouldn't be here");

    }
};
var Block = {
    make: function (target, methodName) {
        var obj = {_target: target, type: 'Block', _method: methodName};
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
        var mname = this._method.substring(1);
        return GLOBAL[mname].apply(null,this._arg);
    }
};

var sem = gram.semantics().addOperation('toAST',{
    int: function(a) {
        return Objects.Integer.make(parseInt(this.interval.contents, 10));
    },
    float: function(a,_,b) {
        return Objects.Float.make(parseFloat(this.interval.contents,10));
    },
    ident: function(a,b) { return "@" +this.interval.contents; },
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
    FunCall: function(a,_,b,_) {
        return [FunctionCall.make(a.toAST(), b.toAST())];
    },
    Arguments: function(a) {      return a.asIteration().toAST();    },
    Block: function(_,b,_) {
        return Block.make(b.toAST());
    },
});


function reduceArray(arr) {
    if(arr.length == 1) return arr[0];
    var first = arr.shift();
    first.apply(arr);
    return reduceArray(arr);
}

function test(input, answer) {
    var match = gram.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = sem(match).toAST();
    //console.log('result = ', JSON.stringify(result,null,' '), answer);
    //console.log("type = ", result.type);
    if(result instanceof Array) {
        result = reduceArray(result);
    }
    if(result.type == 'MethodCall') {
        result = result.apply();
    }
    if(result.type == 'FunctionCall') {
        result = result.apply();
        //console.log("final result is", result);
    }
    if(result.type == 'Block') {
        result = result.apply();
    }
    //assert(result.type,'Integer');
    assert(result.jsEquals(answer),true);

    //assert.deepEqual(result,answer);
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

/*
// variables
test('x','@x');
test('x+5',['@x','add',5]);
test('def x',['def','@x']);
test("4 -> x",[4,'assign','@x']);
test('4+5 -> x',[4,'add',[5,'assign','@x']]);
*/

//block
test('{ 4+5 5+6 }',11);

/*
test('while { x <= 5 } { x+1 }', ['while',
    ['block',[['@x','lte',5]]],
    ['block',[['@x','add',1]]]
]);

test('while { x <= 5 } { x+1 -> x}', ['while',
    ['block',[['@x','lte',5]]],
    ['block',[['@x','add',[1, 'assign', '@x']]]]
]);

test('if { x <= 5 } { x+1 -> x }', ['if',
    ['block',[['@x','lte',5]]],
    ['block',[['@x','add',[1, 'assign', '@x']]]]
]);

//precedence of assignment operator is broken
//precedence of all operators should just be left to right as a list of atoms
*/

