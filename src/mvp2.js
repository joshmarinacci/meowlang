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
            var val = obj[this._method](arg);
            args[0] = val;
            return;
        }

        throw new Error("shouldn't be here");

    }
};

var sem = gram.semantics().addOperation('toAST',{
    int: function(a) {
        var int = parseInt(this.interval.contents, 10);
        return Objects.Integer.make(int);
    },
    float: function(a,_,b) {
        var flt = parseFloat(this.interval.contents,10);
        return Objects.Float.make(flt);
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
    GtExpr: function(a,_,b) {
        return [MethodCall.make(a.toAST(),'greaterThan')].concat(b.toAST());
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
/*
test('4<=5',[4,'lte',5]);
test('4>=5',[4,'gte',5]);
test('4==4',[4,'eq',4]);
test('4!=5',[4,'ne',5]);
*/


//comments
test('4 + //6\n 5',9);
/*
//function calls
test("print(4)",["funcall","@print",[4]]); //returns 4, prints 4
test("max(4,5)",["funcall","@max",[4,5]]); // returns 5

*/
//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");
/*
test('print("foo") ', ["funcall","@print",["foo"]]);

// variables
test('x','@x');
test('x+5',['@x','add',5]);
test('def x',['def','@x']);
test("4 -> x",[4,'assign','@x']);
test('4+5 -> x',[4,'add',[5,'assign','@x']]);

//block
test('{ 4+5 5+6 }',['block',[[4,'add',5],[5,'add',6]]]);

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

