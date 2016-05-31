"use strict";
/**
 * Created by josh on 5/23/16.
 */

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
        this.type = 'KLInteger';
    }
    make(val) {  return new KLInteger(val); }
}

class KLFloat extends KLNumber {
    constructor(lit) {
        super(lit);
        this.val = lit;
        this.type = 'KLFloat';
    }
    make(val) {  return new KLFloat(val); }
}

class KLBoolean {
    constructor(lit) {
        this.val = lit;
        this.type = 'KLBoolean';
    }
    jsEquals (jsValue) { return this.val === jsValue;  }
    isFalse() { return this.val === false }
    isTrue() {  return this.val === true }
    apply () {  return this;  }
}

class KLString {
    constructor(list) {
        this.val = list;
        this.type = 'KLString';
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
    setSymbol(name, obj) {  this.storage[name] = obj; }
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
        this.type = 'KLSymbol';
    }
    apply(scope) {
        return scope.getSymbol(this.name);
    }
}

var FunctionDef = {
    make: function(sym, params, body){
        var obj = { sym: sym, type: 'FunctionDef', params: params, body: body};
        Object.setPrototypeOf(obj, FunctionDef);
        return obj;
    },
    apply: function() {
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
};

var Block = {
    make: function (target) {
        var obj = {_target: target, type: 'Block'};
        Object.setPrototypeOf(obj, Block);
        return obj;
    },
    apply: function(scope) {
        var results = this._target.map((expr) => expr.apply(scope));
        return results.pop();
    }
};

var WhileLoop = {
    make: function(cond, body) {
        var obj = { cond:cond, body:body, type:'WhileLoop'};
        Object.setPrototypeOf(obj, WhileLoop);
        return obj;
    },
    apply: function(scope) {
        var ret = null;
        while(true) {
            var condVal = this.cond.apply(scope);
            if (condVal.type != 'KLBoolean') throw new Error("while condition does not resolve to a KLBoolean!\n" + JSON.stringify(this.cond, null, '  '));
            if (condVal.isFalse()) break;
            ret = this.body.apply(scope);
        }
        return ret;
    }
};

var IfCond = {
    make: function(cond, body) {
        var obj = { cond:cond, body:body, type:'IfCond'};
        Object.setPrototypeOf(obj, IfCond);
        return obj;
    },
    apply: function(scope) {
        var val = this.cond.apply(scope);
        if (val.type != 'KLBoolean') throw new Error("while condition does not resolve to a KLBoolean!\n" + JSON.stringify(this.cond, null, '  '));
        if (val.isTrue()) return this.body.apply(scope);
        return new KLBoolean(false);
    }
};

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

var FunctionCall = {
    make: function(funName, argObj) {
        var obj = { _arg: argObj, type:'FunctionCall', _method:funName};
        Object.setPrototypeOf(obj, FunctionCall);
        return obj;
    },
    apply: function(scope) {
        var mname = this._method;
        var args = this._arg;
        if(args instanceof Array) args = args.map((arg) => arg.apply(scope));
        return GLOBAL[mname.name].apply(null,args);
    }
};

var MethodCall = {
    make: function(target, methodName, arg) {
        var obj = { _target: target, type:'MethodCall', _method:methodName, _arg:arg};
        Object.setPrototypeOf(obj, MethodCall);
        return obj;
    },
    apply: function(scope) {
        var obj = this._target;
        if(obj.apply) obj = obj.apply(scope);
        var arg = this._arg;
        //special case for assign
        if(this._method == 'assign') {
            scope.setSymbol(arg.name,obj);
            return obj;
        }
        if(arg.apply) arg = arg.apply(scope);
        return obj[this._method](arg);
    }
};

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