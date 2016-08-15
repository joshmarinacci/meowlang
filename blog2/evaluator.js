/**
 * Created by josh on 8/15/16.
 */
"use strict";


var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var grammar = ohm.grammar(fs.readFileSync('blog2/grammar.ohm').toString());


class MNumber {
    constructor(val) { this.val = val; }
    resolve(scope)   { return this; }
    jsEquals(jsval)  { return this.val == jsval; }
}

class MSymbol {
    constructor(name) {
        this.name = name;
    }
    resolve(scope) {
        return scope.getSymbol(this.name);
    }
}

class Scope {
    constructor() {
        this.storage = {};
    }
    setSymbol(sym, obj) {
        this.storage[sym.name] = obj;
        return this.storage[sym.name];
    }
    getSymbol(name) {
        if(this.storage[name]) return this.storage[name];
        return null;
    }
}

class BinOp {
    constructor(op, A, B) {
        this.op = op;
        this.A = A;
        this.B = B;
    }
    resolve(scope) {
        var a = this.A.resolve(scope).val;
        var b = this.B.resolve(scope).val;
        if(this.op == 'add') return new MNumber(a+b);
        if(this.op == 'sub') return new MNumber(a-b);
        if(this.op == 'mul') return new MNumber(a*b);
        if(this.op == 'div') return new MNumber(a/b);
    }
}

class Assignment {
    constructor(sym,val) {
        this.symbol = sym;
        this.val = val;
    }
    resolve(scope) {
        return scope.setSymbol(this.symbol, this.val.resolve(scope));
    }
}

var semantics = grammar.createSemantics();


var Calculator = semantics.addOperation('calc', {
    AddExpr: function(a) {
        return a.calc();
    },
    AddExpr_plus: function(a,_,b) {
        return a.calc() + b.calc();
    },
    AddExpr_minus: function(a,_,b) {
        return a.calc() - b.calc();
    },
    MulExpr: function(a) {
        return a.calc();
    },
    MulExpr_times: function(a,_,b) {
        return a.calc() * b.calc();
    },
    MulExpr_divide: function(a,_,b) {
        return a.calc() / b.calc();
    },
    PriExpr_paren: function(_1,a,_2) {
        return a.calc();
    },


    int: function(a) {
        return parseInt(this.sourceString,10);
    },
    float: function(a,b,c,d) {
        return parseFloat(this.sourceString);
    },
    hex: function(a,b) {
        return parseInt(this.sourceString.substring(2),16);
    },
    oct: function(a,b) {
        return parseInt(this.sourceString.substring(2),8);
    }
});


var ASTBuilder = semantics.addOperation('toAST', {
    AddExpr_plus:  (a, _, b) => new BinOp('add', a.toAST(), b.toAST()),
    AddExpr_minus: (a, _, b) => new BinOp('sub', a.toAST(), b.toAST()),
    MulExpr_times: (a, _, b) => new BinOp('mul', a.toAST(), b.toAST()),
    MulExpr_divide:(a, _, b) => new BinOp('div', a.toAST(), b.toAST()),
    PriExpr_paren: (_,a,__)  => a.toAST(),
    Assign:        (a, _, b) => new Assignment(a.toAST(), b.toAST()),

    Identifier: function (a, b)  { return new MSymbol(this.sourceString, null) },
    //reuse the number literal parsing code from `calc` operation
    Number : function(a) { return new MNumber(a.calc()); }
});


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


test('2*3+4', 2*3+4);
test('2*(2*2)',2*2*2);
test('(2*3)*4',(2*3)*4);
test('4+3*2', 4+3*2);
test('(4+3)*2',(4+3)*2);
test('4/5',4/5);
test('4-5',4-5);


test('10',10);
test('x = 10',10);
test('x',10);
test('x * 2',20);
test('x * 0x2',20);
