# Ohm: A Calculator with Symbols


[Last time](link) I introduced [Ohm](https://github.com/cdglabs/ohm), an open source meta language parser 
with an easy to use syntax. We built a parser for different number formats.  This week we will 
extend the parser to calculate arithmetic expressions.

Open up your grammar file and add this code inside `CoolNums {`

```
  // just a basic integer
  Expr =  AddExpr

  AddExpr = AddExpr "+" MulExpr -- plus
          | AddExpr "-" MulExpr -- minus
          | MulExpr

  MulExpr = MulExpr "*" PriExpr -- times
          | MulExpr "/" PriExpr -- divide
          | PriExpr

  PriExpr = "(" Expr ")" -- paren
          | Number
```

The above code is all we need to define full arithmetic with parenthesis and precedence. 
This is a bit complicated so let's break it down into pieces. We can read the grammar 
like this: `Expr` is defined as an additive expression. An additive expression can 
be one of an addition, subtraction, or a multiplication expression. A multiplication 
expression can be one of times, divide or a primary expression. A primary expression 
is an expression (`Expr`) inside parenthesis or a number.

At first this looks very strange.  Why is the general expression (`Expr`) only
an additive expression, and is AddExpr just the first line or all three lines? 
And how would we write this from scratch if we didn't know how to do it beforehand?
Let's break it down into pieces.

## Compound Expressions

Ohm supports a compound syntax to let you define multiple rules at once. Adding 
a `--` after a rule makes it a sub-rule with alternation. An alternation means 
something *or* something else.
 
This code:

```
  AddExpr = AddExpr "+" MulExpr -- plus
          | AddExpr "-" MulExpr -- minus
          | MulExpr
```

is the same as this code:

```
AddExpr        = AddExpr_plus | AddExpr_minus | MulExpr
AddExpr_plus   = AddExpr "+" MulExpr
AddExpr_minus  = AddExpr "-" MulExpr
```

In other words there are three forms of the `AddExpr`: the plus form, the minus form, 
and a multiplication form. Rather than having to break them out separately Ohm lets 
us combine them into a more compact and cleaner syntax.  We still read it as:  
'an _add_ expression can be one of _add plus mul_ or _add - mul_ or just _mul_.'


## Operator Precedence

Second, why do we need to group the plus and minus versions of add together, 
separate from the times and divide forms?  This comes down to operator precedence.

Consider the following expression:

```
4 + 5 * 6
```

Do you evaluate the + or the * first? The order in which we execute the 
operators affects the final answer. In many programming languages (including JavaScript)
there is a defined operator precedence order. Usually multiplication and division 
come before addition and subtraction. The expression above is equivalent to:

```
4 + (5*6)
```

However, some programming languages, like Smalltalk, evaluate operators
left to right *without* any precedence. So the expression above would be equivalent to:

```
(4+5) * 6
```

For this calculator we will go with the JavaScript form of precedence. We must 
group the multiplication and division together and make sure they are executed 
before the addition and subtraction. That's why `Expr` is made up of `AddExpr`, 
and `AddExpr` contains `MulExpr`, and `MulExpr` contains the `PriExpr`. 
Only in `PriExpr` do we get to actual numbers.  At first this seems backwards. If
`MulExpr` comes first then why is is listed after `AddExpr`? 

We need to consider how things will be evaluated.  `4 + 5 * 6` will be parsed into this:

```
Add(4, Mul(5,6))
```

The *innermost* expression is evaluated first, so the `MulExpr` must be closest 
to `Number`.  Adds will be evaluated only after all the Muls are done. 
We define Add in terms of Mul because Add will always contain Mul. 
Mul will never contain Add (without parenthesis). 

I realize this is tricky to understand, and honestly it's one of the 
reasons I prefer Smalltalk's approach of left to right.  In general 
you only need to implement this once and it's common to just borrow 
from another grammar that get's it right. I've adapted this one from 
the official [Ohm Math](https://github.com/cdglabs/ohm/blob/master/examples/math/index.html) example.

## Performing Arithmetic

Now that we have a parser that we *know* processes things in the right order 
we can actually do some arithmetic. As we discussed last time, 
the _grammar_ just parses text into a tree without actually doing any 
work. The _semantics_ define the real actions which do things. Each action 
function will perform an operation on the results of its sub nodes.  
So `4+5` will add the `4` and `5` nodes together. Each of those nodes 
is an int which returns a real JS number.

Here's what the actions look like for arithmetic:

``` javascript
var Calculator = grammar.createSemantics().addOperation('calc', {
    AddExpr: function(a) {
        return a.calc();
    },
    AddExpr_plus: function(a,_,b) {
        return a.calc() + b.calc();
    },
    MulExpr: function(a) {
        return a.calc();
    },
    MulExpr_times: function(a,_,b) {
        return a.calc() * b.calc();
    },
    //these are the same as before in the previous blog
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
```


The first actions are the only new ones. The others are the same ones 
from the last blog, they parse all of the forms of numbers (integers, 
floating point, hexadecimal, and octal).

That's actually it.  Just do the basic math for each expression.  Of course, 
if we just built a simple calculator we wouldn't be using the full power of Ohm.
 
 
# Building an Expression Tree  

Our goal is to eventually extend this into a real programming language and
what we have now just won't do.  It evaluates expressions as they are found
in the source code. That's fine for basic math, but what if we want to handle
calling a function inside of a loop? The action would only be called once, but
we want to invoke the function every time inside of the loop! 

Eventually we will also want variables with the ability to run code like `x=10`
followed by `x*2`. Now we need a symbol table and a way to look up 
the *current* value of the symbol when the math is evaluated.  Doing math immediately
simply won't work anymore.

The solution is to not perform arithmetic inside of the semantic operation. Instead we must
return a tree of objects which represent the arithmetic (and later loops and functions)
and can be evaluated anytime we need it.  This is called an *expression tree*, and
it's the next big step for building a language interpreter.

Let's define some terms:

* A *number* is an actual numeric constant. Something like 4 or 4.5 or 0x45. 
* A *symbol* is an identifier which *points to* a number. Something like `x` or `myVal`.
* An *assignment* is an operation which makes a symbol point to a real number.
* A binary operation, or *BinOp*, is a math operation which takes two arguments. Something like 4+5 or 4/5. Right now we only support basic arithmetic, but in the future we will support boolean operators like x<5 and 7!=y, so we'll call them binary operations instead of math ops.
 
The key concept when building a language is _resolution_. We can say that the 
expression 4+5 *resolves* to 9. Resolution is when we do actual work; the 
actual calculations. Resolving a binary operation executes the actual 
operation. Resolving a symbol returns the underlying value that the symbol 
points to.  Resolving a number just returns itself, the number.
 
With these definitions we can start to build some code.
 
First, let's create a class which represents a number. It stores an underlying 
javascript value, `val`, and returns itself when `resolve` is called.

```
class MNumber {
 constructor(val) { this.val = val; }
 resolve(scope)   { return this; }
 jsEquals(jsval)  { return this.val == jsval; }
}
```

Note that I added a `jsEquals` method. This lets us compare the number to a 
real Javascript number. It is not part of our exposed API, but it is helpful 
when writing our unit tests later.


Now we can define our basic binary operations for arithmetic. Since addition, subtraction, 
and the others are basically all the same, create a single `BinOp` class instead of one for each operation.
 
```
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
```

BinOp accepts the operation and two values to perform the operation on 
(called _operands_ in math terms).  The `resolve` method will call `resolve` 
on the two operands, pull out the underlying javascript values, then return
a new `MNumber` by combining them into new values.  We _could_ skip 
calling resolve on the operands because `resolve()` on a plain number just returns 
itself. However, I included the resolve call here because later on the operand 
might not be a number. It might be a symbol or function instead. 
Defining everything in terms of `resolve` keeps the code future-proof.

Now we can create our new semantics operation called `toAST()`. Keep the
existing operation, `calc`, in place. Add to it by creating a second semantics.
 
 
```
var semantics = grammar.createSemantics();

var Calculator = semantics.addOperation('calc', {
   ...
});

var ASTBuilder = semantics.addOperation('toAST', {
    AddExpr_plus:  (a, _, b) => new BinOp('add', a.toAST(), b.toAST()),
    AddExpr_minus: (a, _, b) => new BinOp('sub', a.toAST(), b.toAST()),
    MulExpr_times: (a, _, b) => new BinOp('mul', a.toAST(), b.toAST()),
    MulExpr_divide:(a, _, b) => new BinOp('div', a.toAST(), b.toAST()),
    PriExpr_paren: (_,a,__)  => a.toAST(),

    //reuse the number literal parsing code from `calc` operation
    Number : function(a) { return new MNumber(a.calc()); }
});
```
          
As before, most actions recursively call `toAST()` on the argument. However, 
the action for Number actually calls `calc` instead of `toAST`. The `Calculator`
semantics already define how to parse numbers. We don't need to write that part again.
Instead we _delegate_ to the existing `calc` operation.

This delegation system is a key part of Ohm's design. You can have multiple 
semantic operations which call each other, as long as they are in the
same set of semantics. This is another way to reuse code across parsers.  
If we one day want to extend our math language further we could do it by 
creating additional semantic operations instead of modifying the originals.

With the `toAST` semantics in place we can now rewrite the test code like this:

```
function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var ast = ASTBuilder(match).toAST();
    var result = ast.resolve();
    console.log('result = ', result);
    assert.deepEqual(result.jsEquals(answer),true);
    console.log('success = ', result, answer);
}
```

Calling `toAST()` returns an expression object instead of a value. Then we can 
call resolve on this object to get the final value. This might seem like a lot 
of work for what is fundamentally the same behavior as our earlier `calc` 
operation that did the arithmetic inline.  The reason we did all this is to lay
the ground for a more advanced feature: _symbols_.

# Adding Symbols


To support variables we need a concept called a symbol. A symbol is just a name, 
or identifier, which points to a real value. In many cases we could use a real number 
value instead of a symbol, but symbols give us a special ability: symbols can be 
_redefined_. You can write `x=2` and `x*5` to get `10`. Then write `x=3` and call `x*5` again
to get `15`. The same code can be invoked multiple times with different results by 
changing what the symbol _points_ to. This is one of the fundamental concepts of 
computer science which makes computation possible.
 
Let's start by creating an `MSymbol` class (I didn't use the name `Symbol` because that will 
clash with the future native Symbol class in Javascript).
 
```
class MSymbol {
    constructor(name) {
        this.name = name;
    }
    resolve(scope) {
        return scope.getSymbol(this.name);
    }
}
```

Now we need a place to actually sort what the symbols point to. This is called a 
_scope_. For now we will have only one scope called GLOBAL, but in the future we 
will have more.


```
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
```


Now we can create the `Assignment` operator which actually sets the symbol's value.


```
class Assignment {
    constructor(sym,val) {
        this.symbol = sym;
        this.val = val;
    }
    resolve(scope) {
        return scope.setSymbol(this.symbol, this.val.resolve(scope));
    }
}
```



With the various classes in place we just need to update the grammar and our semantics to support it.

Update the grammar like this:

```
CoolNums {
    // just a basic integer
    Expr =  Assign | AddExpr | Identifier | Number
    
    AddExpr = AddExpr "+" MulExpr -- plus
          | AddExpr "-" MulExpr -- minus
          | MulExpr
    
    MulExpr = MulExpr "*" PriExpr -- times
          | MulExpr "/" PriExpr -- divide
          | PriExpr
    
    PriExpr = "(" Expr ")" -- paren
          | Identifier
          | Number
    
    Assign = Identifier "=" Expr
    Identifier = letter (letter|digit)*
    
    Number = oct | hex | float | int
    int    = digit+
    float  = digit+ "." digit+ exp?
    exp    = "e" "-"? digit+
    hex    = "0x" hexDigit+
    oct    = "0o" octDigit+
    octDigit = "0".."7"
    //hexDigit := "0".."9" | "a".."f" | "A".."F" //already defined by Ohm
}
```


Note that I've refactored the grammar slightly. Now `Expr` is one of `Assign`, `AddExpr`,
`Identifier`, or `Number`. `Identifier` is a variable name that starts with a
letter and contains letters or numbers. `Assign` is an identifier and an expression 
separated by the `=` character.

Add these two rules to the `toAST` semantics operation:


```
    Assign:        (a, _, b) => new Assignment(a.toAST(), b.toAST()),
    Identifier: function (a, b)  { return new MSymbol(this.sourceString, null) },
```

Note that we must turn on _strict mode_ to use the new JavaScript class syntax in NodeJS by putting 
'use strict' at the top of the file. This also lets us use the arrow syntax for more compact rule definitions.
Also Notice that I didn't use the arrow syntax for the Identifier rule because this 
needs to reference the `this` variable of the rule. The arrow syntax uses the `this` of 
the enclosing object, which is what we want in most cases but not this particular case.


Now we can add some more unit tests for our new variable syntax with symbols:

```
test('10',10);
test('x = 10',10);
test('x',10);
test('x * 2',20);
test('x * 0x2',20);
```


## Conclusion

Building a language seems complex at first, but by breaking it down into small steps 
it becomes quite approachable. We've actually done most of the hard work already.  
We expanded our number parser into a full calculator, and then into a baby programming 
language by adding symbols and an AST.  Next time we will add conditionals, loops, and 
function calls to turn this into a real programming language. 

The code for this entire series is available at my [github repo](link), but don't
cheat by looking ahead! :)

