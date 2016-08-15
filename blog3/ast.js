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

module.exports = {
    MNumber:MNumber,
    MSymbol:MSymbol,
    BinOp:BinOp,
    Assignment:Assignment,
    Scope:Scope
};
