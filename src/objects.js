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
        return Boolean.make(this._val < other._val);
    },
    lessThanEqual: function(other) {
        return Boolean.make(this._val <= other._val);
    },
    greaterThan: function(other) {
        return Boolean.make(this._val > other._val);
    },
    greaterThanEqual: function(other) {
        return Boolean.make(this._val >= other._val);
    },
    equal: function(other) {
        return Boolean.make(this._val == other._val);
    },
    notEqual: function(other) {
        return Boolean.make(this._val != other._val);
    },
    assign: function(sym) {
        sym.setValue(this);
        return this;
    },
    jsEquals: function(jsValue) {
        return this._val == jsValue;
    }
};

var UnitInteger = {
    make: function(lit, unit) {
        var obj = { _val: lit, _unit: unit}
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
}
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
    }
};

var Boolean = {
    make: function(lit) {
        var obj = {
            _val:lit, type:'Boolean',
        }
        Object.setPrototypeOf(obj, Boolean);
        return obj;
    },
    jsEquals: function(jsValue) {
        return this._val === jsValue;
    }
}

var String = {
    make: function(lit) {
        var obj = {
            _val:lit, type:'String',
        }
        Object.setPrototypeOf(obj, String);
        return obj;
    },
    add: function(other) {
        return this.make(this._val + other._val);
    },
    jsEquals: function(jsValue) {
        return this._val === jsValue;
    }
};

var Symbol = {
    scope:{},
    make: function(name, scope) {
        if(!this.scope[name]) {
            var obj = {
                name:name, type:'Symbol',
                value:null,
            };
            Object.setPrototypeOf(obj, Symbol);
            this.scope[name] = obj;
        }
        return this.scope[name];
    },
    setValue: function(v) {
        this.value = v;
        return v;
    },
    getValue: function() {
        return this.value;
    },
    dump: function() {
        console.log("current scope",this.scope);
        Object.keys(this.scope).forEach((name)=> {
            console.log("name = ",name, this.scope[name]);
        });
    }
};

var Block = {
    make: function (target) {
        var obj = {_target: target, type: 'Block'};
        Object.setPrototypeOf(obj, Block);
        return obj;
    },
    apply: function() {
        var results = this._target.map(function(expr) {
            if(expr instanceof Array) return reduceArray(expr);
            return expr;
        });
        return results.pop();
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
        var res = null;
        while(true) {
            var val = this.cond.apply();
            if (val.type != 'Boolean') throw new Error("while condition does not resolve to a boolean!\n" + JSON.stringify(this.cond, null, '  '));
            if (val._val == false) {
                break;
            } else {
                res = this.body.apply();
            }
        }
        return res;
    }
}

var IfCond = {
    make: function(cond, body) {
        var obj = { cond:cond, body:body, type:'IfCond'};
        Object.setPrototypeOf(obj, IfCond);
        return obj;
    },
    apply: function() {
        var val = this.cond.apply();
        if (val.type != 'Boolean') throw new Error("while condition does not resolve to a boolean!\n" + JSON.stringify(this.cond, null, '  '));
        if (val._val == true) {
            return this.body.apply();
        }
    }
}

var GLOBAL = {
    print : function (arg) {
        console.log('print:',arg._val);
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
    apply: function() {
        var mname = this._method;
        var args = this._arg;
        if(args instanceof Array) {
            if(args[0].type == 'Symbol') {
                args = args.slice();
                args[0] = args[0].getValue();
            }
        }
        return GLOBAL[mname.name].apply(null,args);
    }
};

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
        args[0] = obj[this._method](arg);
        return;
    }
};

function reduceArray(arr) {
    arr = arr.slice();
    if(arr.length == 1) {
        var first = arr[0];
        if(arr[0].type == 'FunctionCall') return arr[0].apply();
        return arr[0];
    }
    var first = arr.shift();
    first.apply(arr);
    return reduceArray(arr);
}


module.exports = {
    Integer: Integer,
    Float: Float,
    Boolean: Boolean,
    String: String,
    Symbol: Symbol,
    Block: Block,
    reduceArray: reduceArray,
    WhileLoop: WhileLoop,
    IfCond: IfCond,
    MethodCall: MethodCall,
    FunctionCall: FunctionCall
};