"use strict";

class KLNumber {
    apply() { return this;  }
    add(other) {              return this.make(this.val +  other.val); }
    multiply(other) {         return this.make(this.val *  other.val); }
    divide(other) {           return this.make(this.val /  other.val); }
    lessThan(other) {         return new KLBoolean(this.val <  other.val); }
    lessThanEqual(other) {    return new KLBoolean(this.val <= other.val); }
    greaterThan(other) {      return new KLBoolean(this.val >  other.val); }
    greaterThanEqual(other) { return new KLBoolean(this.val >= other.val); }
    equal(other) {            return new KLBoolean(this.val == other.val); }
    notEqual(other) {         return new KLBoolean(this.val != other.val); }
    jsEquals(val)   {         return this.val === val; }
}

class KLInteger extends KLNumber {
    constructor(lit) {
        super();
        this.val = lit;
    }
    make(val) {  return new KLInteger(val); }
}

class KLFloat extends KLNumber {
    constructor(lit) {
        super(lit);
        this.val = lit;
    }
    make(val) {  return new KLFloat(val); }
}

class KLBoolean {
    constructor(lit) {
        this.val = lit;
    }
    jsEquals (jsValue) { return this.val === jsValue;  }
    isFalse() { return this.val === false }
    isTrue() {  return this.val === true }
    apply () {  return this;  }
}

class KLString {
    constructor(list) {
        this.val = list;
    }
    add(other) { return new KLString(this.val + other.val); }
    jsEquals(jsValue) {   return this.val === jsValue; }
    apply() { return this; }
}

class KLScope {
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

var GlobalScope = new KLScope();


class KLSymbol {
    constructor(name) {
        this.name = name;
    }
    apply(scope) {  return scope.getSymbol(this.name);  }
}

class FunctionDef {
    constructor(sym, params, body) {
        this.sym = sym;
        this.params = params;
        this.body = body;
    }
    apply(scope) {
        //create a global function for this body
        var body = this.body;
        var params = this.params;
        GLOBAL[this.sym.name] = function() {
            var args = arguments;
            var scope = GlobalScope.makeSubScope();
            params.forEach((param,i) => scope.setSymbol(param.name,args[i]));
            return body.apply(scope);
        }
    }
}

class Block {
    constructor(target) {
        this.target = target;
    }
    apply(scope) {
        var results = this.target.map((expr) => expr.apply(scope));
        return results.pop();
    }
}

class WhileLoop {
    constructor(cond, body) {
        this.cond = cond;
        this.body = body;
    }
    apply(scope) {
        while(true) {
            var condVal = this.cond.apply(scope);
            if (!condVal instanceof KLBoolean) throw new Error("while condition does not resolve to a KLBoolean!\n" + JSON.stringify(this.cond, null, '  '));
            if (condVal.isFalse()) break;
            var ret = this.body.apply(scope);
        }
        return ret;
    }
}

class IfCond {
    constructor(cond, body) {
        this.cond = cond;
        this.body = body;
    }
    apply(scope) {
        var val = this.cond.apply(scope);
        if (! (val instanceof  KLBoolean)) throw new Error("while condition does not resolve to a KLBoolean!\n" + JSON.stringify(this.cond, null, '  '));
        if (val.isTrue()) return this.body.apply(scope);
        return new KLBoolean(false);
    }
}

var GLOBAL = {
    print : function (arg) {
        console.log('print:',arg.val);
        return arg;
    },
    max: function(A,B) {
        if(A.greaterThan(B).jsEquals(true)) return A;
        return B;
    }
};

class FunctionCall {
    constructor(funName, argObj) {
        this.method = funName;
        this.arg = argObj;
    }
    apply(scope) {
        var args = this.arg;
        if(args instanceof Array) args = args.map((arg) => arg.apply(scope));
        return GLOBAL[this.method.name].apply(null,args);
    }
}

class MethodCall {
    constructor(target, methodName, arg) {
        this.target = target;
        this.method = methodName;
        this.arg = arg;
    }
    apply(scope) {
        var obj = this.target.apply(scope);
        //special case for assign
        if(this.method == 'assign') return scope.setSymbol(this.arg.name,obj);
        return obj[this.method](this.arg.apply(scope));
    }
}

module.exports = {
    KLInteger: KLInteger,
    KLFloat: KLFloat,
    KLBoolean: KLBoolean,
    KLString: KLString,
    KLSymbol: KLSymbol,
    Block: Block,
    WhileLoop: WhileLoop,
    IfCond: IfCond,
    MethodCall: MethodCall,
    FunctionCall: FunctionCall,
    FunctionDef: FunctionDef,
    GlobalScope: GlobalScope
};