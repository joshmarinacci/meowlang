"use strict";
/**
 * Created by josh on 5/23/16.
 */

var Integer = {
    make: function(lit) {
        var obj = { _val: lit, type:'Integer'};
        Object.setPrototypeOf(obj, Integer);
        return obj;
    },
    withUnit: function(unit) {
        return UnitInteger.make(this._val,unit);
    },
    add: function(other) {
        return this.make(this._val + other._val);
    },
    multiply: function(other) {
        return this.make(this._val * other._val);
    },
    divide: function(other) {
        return this.make(this._val / other._val);
    },
    lessThan: function(other) {
        return new KLBoolean(this._val < other._val);
    },
    lessThanEqual: function(other) {
        return new KLBoolean(this._val <= other._val);
    },
    greaterThan: function(other) {
        return new KLBoolean(this._val > other._val);
    },
    greaterThanEqual: function(other) {
        return new KLBoolean(this._val >= other._val);
    },
    equal: function(other) {
        return new KLBoolean(this._val == other._val);
    },
    notEqual: function(other) {
        return new KLBoolean(this._val != other._val);
    },
    jsEquals: function(jsValue) {
        return this._val == jsValue;
    },
    apply: function() {
        return this;
    }
};

var UnitInteger = {
    make: function(lit, unit) {
        var obj = { _val: lit, _unit: unit};
        Object.setPrototypeOf(obj,UnitInteger);
        return obj;
    },
    multiply: function(other) {
        if(other._unit) {
            return this.make(this._val * other._val, this._unit);
        } else {
            return this.make(this._val * other._val, this._unit);
        }
    }
};
Object.setPrototypeOf(UnitInteger, Integer);

var Float = {
    make: function(lit) {
        var obj = { _val: lit, type:'Float'};
        Object.setPrototypeOf(obj, Float);
        return obj;
    },
    add: function(other) {
        return this.make(this._val + other._val);
    },
    multiply: function(other) {
        return this.make(this._val * other._val);
    },
    divide: function(other) {
        return this.make(this._val / other._val);
    },
    assign: function(sym) {
        sym._val = this;
        return sym;
    },
    jsEquals: function(jsValue) {
        return this._val == jsValue;
    },
    apply: function() {
        return this;
    }
};

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

var Scope = {
    storage: {},
    makeSubScope: function() {
        var ss = { storage: {} };
        Object.setPrototypeOf(ss,Scope);
        return ss;
    },
    hasSymbol: function(name) {
        return this.storage[name]
    },
    setSymbol: function(name, obj) {
        this.storage[name] = obj;
    },
    getSymbol: function(name) {
        return this.storage[name];
    },
    dump: function() {
        console.log("scope: ");
        Object.keys(this.storage).forEach((name) => {
            console.log("   name = ",name, this.storage[name]);
        });
    }
};


var Symbol = {
    make: function(name) {
        var obj = { name:name, type:'Symbol'};
        Object.setPrototypeOf(obj, Symbol);
        return obj;
    },
    apply: function(scope) {
        return scope.getSymbol(this.name);
    }
};


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
            var scope = Scope.makeSubScope();
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
    Integer: Integer,
    Float: Float,
    KLBoolean: KLBoolean,
    KLString: KLString,
    Symbol: Symbol,
    Block: Block,
    WhileLoop: WhileLoop,
    IfCond: IfCond,
    MethodCall: MethodCall,
    FunctionCall: FunctionCall,
    FunctionDef: FunctionDef,
    GlobalScope: Scope
};