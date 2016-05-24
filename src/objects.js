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
    greaterThan: function(other) {
        return Boolean.make(this._val > other._val);
    },
    assign: function(sym) {
        sym._val = this;
        return sym;
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

module.exports = {
    Integer: Integer,
    Float: Float,
    Boolean: Boolean,
    String: String
};