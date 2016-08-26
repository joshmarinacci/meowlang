"use strict";

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
        if(this.op == 'eq')  return new MNumber(a==b);
        if(this.op == 'neq') return new MNumber(a!=b);
        if(this.op == 'gt')  return new MNumber(a>b);
        if(this.op == 'lt')  return new MNumber(a<b);
        if(this.op == 'gte') return new MNumber(a>=b);
        if(this.op == 'lte') return new MNumber(a<=b);
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

class Block {
    constructor(block) {
        this.statements = block;
    }
    resolve(scope) {
        var vals = this.statements.map((expr) => expr.resolve(scope));
        //only return the last one
        return vals.pop();
    }
}

class IfCondition {
    constructor(cond, thenBody, elseBody) {
        this.cond = cond;
        this.thenBody = thenBody;
        this.elseBody = elseBody;
    }
    resolve(scope) {
        var val = this.cond.resolve(scope);
        if (val.val == true) {
            return this.thenBody.resolve(scope);
        }
        if(this.elseBody) return this.elseBody.resolve(scope);
        return new MNumber(false);
    }
}

class WhileLoop {
    constructor(cond, body) {
        this.cond = cond;
        this.body = body;
    }
    resolve(scope) {
        var ret = new MNumber(null);
        while(true) {
            var condVal = this.cond.resolve(scope);
            if (condVal.jsEquals(false)) break;
            ret = this.body.resolve(scope);
        }
        return ret;
    }
}


class FunctionCall {
    constructor(fun, args) {
        this.fun = fun;
        this.args = args;
    }
    resolve(scope) {
        //lookup the real function from the symbol
        //if(!scope.hasSymbol(this.fun.name)) throw new Error("cannot resolve symbol " + this.fun.name);
        var fun = scope.getSymbol(this.fun.name);
        //resolve the args
        var args = this.args.map((arg) => arg.resolve(scope));
        //execute the real javascript function
        return fun.apply(null,args);
    }
}



module.exports = {
    MNumber:MNumber,
    MSymbol:MSymbol,
    BinOp:BinOp,
    Assignment:Assignment,
    Scope:Scope,
    Block: Block,
    IfCondition:IfCondition,
    WhileLoop:WhileLoop,
    FunctionCall:FunctionCall
};
