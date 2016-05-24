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


module.exports = {
    Integer: Integer
};