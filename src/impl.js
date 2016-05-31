/**
 * Created by josh on 5/23/16.
 *
 * simplest version would have basic math, calling built in functions, assign to variables. everything is a value object. operators are just methods on the default objects. literals are just new instances of standard objects. assume prototype inheritance, but semantically it doesn’t matter yet. units are optional, become someNumber.withUnit(‘meters’) which returns the unit version of the number and understand unit arithmetic

 should be able to implement

 part 1, basic literal manipulation and calling functions

 - 4 + 5 + 6
 - prints 15 //really 4.add(5).add(6)
 - 4 * 5 / 2
 - prints 10 // real 4.multiply(5).divide(2)
 - 4 + 5 * 2
 - prints 18 // really 4.add(5).multiply(2)
 - 4 + ( 5 * 2 )
 - prints 14 // really 4.add((5.multiplly(2)))
 - max(4,2)
 - prints 4 // max is a builtin
 - pow(4,2)
 - prints 16  // pow is a builtin
 - add(4,5,6,7,8)  // function with var args
 - 4 meter * 5 // prints 20 meters
 - 4 meter * meter // prints 20 meters squared
 */

var Symbol = {
    make: function(name, scope) {
        var obj = { _name: name, _scope: scope, _type:"SYMBOL"};
        Object.setPrototypeOf(obj, Symbol);
        return scope.register(name,obj);
    },
    lookup: function() {
        return this._scope.lookup(this._name);
    }
};

var Scope = {
    make: function(parent) {
        var obj = {
            _storage: {}
        };
        if(parent) {
            Object.setPrototypeOf(parent);
        } else {
            Object.setPrototypeOf(obj, Scope);
        }
        return obj;
    },
    register: function(name, value) {
        if(!this._storage[name]) this._storage[name] = value;
        return this._storage[name];
    }
};

function test(a,b) {
    //console.log("a == ",a);
    if(a._type == 'SYMBOL') {
        var value = a.val;
        return test(value,b);
    }
    if(a.jsEquals(b)) {
        console.log("true");
    } else {
        console.log("false");
    }
}

function calc(obj) {
    if(obj instanceof Array) {
        // evaluate everthing, return the last expression
        return obj[obj.length-1];
    }
    return obj;
}



var Group = {
    make: function(val) {
        return val;
    }
};

var FunMax = {
    make: function() {
        var obj = {};
        Object.setPrototypeOf(obj, FunMax);
        return obj;
    },
    perform: function(a,b) {
        if(a.val > b.val) return a;
        return b;
    }
};

var FunPow = {
    make: function() {
        var obj = {};
        Object.setPrototypeOf(obj, FunPow);
        return obj;
    },
    perform: function(a,b) {
        var val =  Math.pow(a.val, b.val);
        return Integer.make(val);
    }
};



//console.log(Integer.make(4).add(Integer.make(5)));
//test(calc(parse("4+5+6"),15));
test(calc(Integer.make(4).add(Integer.make(5)).add(Integer.make(6))),15);
//test(calc(parse("4*5/2"),10));
test(calc(Integer.make(4).multiply(Integer.make(5)).divide(Integer.make(2))),10);
//test(calc(parse("4+5*2"),18));
test(calc(Integer.make(4).add(Integer.make(5)).multiply(Integer.make(2))),18);
//test(calc(parse("4+(5*2)"),14));
test(calc(Integer.make(4).add(Group.make(Integer.make(5).multiply(Integer.make(2))))),14);
//test(calc(parse("max(4,2)"),4));
test(calc(FunMax.make().perform(Integer.make(4),Integer.make(2))),4);
//test(calc(parse("pow(4,2)"),16));
test(calc(FunPow.make().perform(Integer.make(4),Integer.make(2))),16);
//test(calc(parse("4 meter")),4);
test(calc(Integer.make(4).withUnit('meter')),4);
//test(calc(parse("4 meter * 5")),20);
test(calc(Integer.make(4).withUnit('meter').multiply(Integer.make(5))),20);
//test(calc(parse("4 meter * 5 meter")),20);
test(calc(Integer.make(4).withUnit('meter').multiply(Integer.make(5).withUnit('meter'))),20);

//4 + 5 => x, x // prints 9
var scope = Scope.make();
test(calc([Integer.make(4).add(Integer.make(5)).assign(Symbol.make('x',scope)),Symbol.make('x',scope)]),9);



/*
test(calc(parse("add(4,5,6,7,8)"),18));
*/