# Building Meow, a Complete Language in < 200 LOC


Welcome back. In [blog one](link) we introduced [Ohm](link) and wrote our own parser to handle 
numbers in various formats. In [blog two](link), we turned our parser into a real arithmetic 
language with binary operations and symbols.  Finally in this blog we will complete our language
with conditionals, loops, and user defined functions.

# Code Cleanup

The first thing our language needs is a name. I'm a fan of cats, but Cat and Kitty are already used
by [existing](link) [languages](link) so I'm going to call our new language Meow. However, before we dive 
into new features features, let's do a little refactoring.  

Move all of the AST classes into a file called `ast.js`. NodeJS doesn't support 
the new module loading syntax of ES6 yet, so we'll have to manually export the classes like this:

```
"use strict";

class MNumber {
    constructor(val) { this.val = val; }
    resolve(scope)   { return this; }
    jsEquals(jsval)  { return this.val == jsval; }
}

... rest of the classes

module.exports = {
    MNumber:MNumber,
    MSymbol:MSymbol,
    BinOp:BinOp,
    Assignment:Assignment,
    Scope:Scope
};
```

Now move the semantic actions into a `semantics.js` file.  

```
"use strict";

var AST = require('./ast');

module.exports.make = function(semantics) {
    var Calculator = semantics.addOperation('calc', {
    ... the rest of the Calculator semantics rules
    }
    var ASTBuilder = semantics.addOperation('toAST', {
    ... the rest of the ASTBuilder semantics rules
    });

    return {
        Calculator:Calculator,
        ASTBuilder:ASTBuilder
    }
};    
```

Finally the test harness in `test.js` can become a lot simpler:

```
"use strict";

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Scope = require('./ast').Scope;

var grammar = ohm.grammar(fs.readFileSync('blog3/grammar.ohm').toString());
var semantics = grammar.createSemantics();

var ASTBuilder = require('./semantics').make(semantics).ASTBuilder;

var GLOBAL = new Scope(null);

function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var ast = ASTBuilder(match).toAST();
    var result = ast.resolve(GLOBAL);
    console.log('result = ', result);
    assert.deepEqual(result.jsEquals(answer),true);
    console.log('success = ', result, answer);
}

test('4+5*10',4+5*10);
test('10',10);
test('x = 10',10);
test('x',10);
test('x * 2',20);
```


To further clean up the code we will go back to Smalltalk precedence. I've always found
it a pain to remember operator precedence. From now on all expressions will
be evaluated left to right. If you want higher precedence you have to use parenthesis. This will
make our implementation *far* simpler, and also be easier for programmers to reason about. All arithmetic
is now grouped under `MathOp`.

Now the grammar looks like this:

```
CoolNums {
    // just a basic integer
    Expr =  Assign | Group | MathOp | Identifier | Number

    MathOp = Mul | Div | Add | Sub
    Add = Expr "+"  Expr
    Sub = Expr "-"  Expr
    Mul = Expr "*"  Expr
    Div = Expr "/"  Expr
    Group = "(" Expr ")"


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




## Boolean Expressions

For conditionals we need two things: boolean operations that evaluate to true or false, and an if statement which will execute code when the condition is met. Boolean conditions are easy because they are *binary operations* (BinOps) just like the addition and other math functions.  To support the equality operator add this to the grammar

```
    MathOp = Mul | Div | Add | Sub | Eq 

    Eq  = Expr "==" Expr
```

Update the `toAST` semantic operation with

```
        Eq: (a, _, b)  => new AST.BinOp('eq', a.toAST(), b.toAST()),
```


And update `BinOp` to support the `eq` operator by adding a new line at the bottom of `resolve.

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
        if(this.op == 'eq')  return new MNumber(a==b);
    }
}
```

Now this test case will evaluate correctly: `test('4==4',true);`.  

In fact, *every* boolean operation can be implemented this way.  Here's the final grammar with support for all of the common boolean operations:

    MathOp = Mul | Div | Add | Sub | Eq | Neq | Lt | Lte | Gt | Gte
    Add = Expr "+"  Expr
    Sub = Expr "-"  Expr
    Mul = Expr "*"  Expr
    Div = Expr "/"  Expr
    Eq  = Expr "==" Expr
    Neq = Expr "!=" Expr
    Lt  = Expr "<"  Expr
    Lte = Expr "<=" Expr
    Gt  = Expr ">"  Expr
    Gte = Expr ">=" Expr


And extra semantic rules

        Eq: (a, _, b)  => new AST.BinOp('eq', a.toAST(), b.toAST()),
        Neq: (a, _, b) => new AST.BinOp('neq', a.toAST(), b.toAST()),
        Gt: (a, _, b)  => new AST.BinOp('gt', a.toAST(), b.toAST()),
        Lt: (a, _, b)  => new AST.BinOp('lt', a.toAST(), b.toAST()),
        Gte: (a, _, b) => new AST.BinOp('gte', a.toAST(), b.toAST()),
        Lte: (a, _, b) => new AST.BinOp('lte', a.toAST(), b.toAST()),


Extra lines in the `BinOp` class

```
        if(this.op == 'eq')  return new MNumber(a==b);
        if(this.op == 'neq') return new MNumber(a!=b);
        if(this.op == 'gt')  return new MNumber(a>b);
        if(this.op == 'lt')  return new MNumber(a<b);
        if(this.op == 'gte') return new MNumber(a>=b);
        if(this.op == 'lte') return new MNumber(a<=b);
```

And of course we need some more tests in `test.js` for the new features:

```
test('4==4',true);
test('4!=5',true);
test('4<5',true);
test('4>5',false);
test('4<=5',true);
test('4>=5',false);
```


## Code Blocks


Now that we have an expression which can resolve to true or false, we need blocks of code to evaluate.

So far our little language can do math and set variables, but it can't really do more than one thing at time. It only supports one expression per-parse. Later on we'll want to have functions which do multiple calculations and return the final result. To do this we need a way to combine expressions.  Let's define what we want:


* An *Expression* is something which evaluates to a single value. `4` is an expression. `2*(4*5+myVar)` is also an expression. And once we support function calls  `5 * doStuff(3,4))` will also be an expression. 
* A *Statement* is an expression which doesn't return a value. For simplicity sake we'll say that all statements return `null`.
* A *Block* is a sequence of expressions or statements which are evaluated in order, and then returns the value of the final expression. 

Now create a Block class in `ast.js`. When `resolve` is called it resolves all of the statements
 and returns the value of the last one. 


```
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
```

Now we can parse blocks by adding this to the grammar `grammar.ohm`:

```
    Block = "{" Expr* "}"
```

and change the definition of `Expr` to include `Block`
    
```
Expr =  Block | Assign | AddExpr | Identifier | Number
```


Then add this to the semantics in `semantics.js`

```
        Block: (_, body, _1) => new AST.Block(body.toAST()),
```

And of course a test case in `test.js`.

```
test('{4+5}',9);
```


Now we can parse code like, which will return the value of the last line (23).
```
{ 
  x=4*5
  y=x+6
  y-3
}
```


## If Statement

With blocks and conditions we can finally build an `if` statement. For Meow we'll use an if with three blocks. The first block is the expression that must evaluate to true or false. The second block will be evaluated if the first block is true. The else clause is optional, and will be evaluated if the first block is false.  With everything else in place implementing `if` will be easy.

The `IfCondition` class in `ast.js`:

```
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
        return new MBoolean(false);
    }
}
```


A new rule in the grammar

```
    Expr =  IfExpr | Block | Assign | Group | MathOp | Identifier | Number
    IfExpr    = "if" Block Block ("else" Block)?
```


A new action in the semantics

```
        IfExpr: (_,cond,thenBlock,__,elseBlock) => {
            var thenBody = thenBlock.toAST();
            var elseBody = elseBlock ? elseBlock.toAST()[0] : null;
            return new AST.IfCondition(cond.toAST(), thenBody, elseBody);
        },
```

And finally the new test cases

```
//if then else
test('if{4==2+2}{1}',1);
test('if{4==2+2}{1}else{2}',1);
test('if{4==2+3}{1}else{2}',2);
```


## Next Time

Now all of our tests can pass and we have a real language with conditionals.  Next time we will add a while loop and real user defined functions, which is the last component required to make Meow a full usable language.

I know this feels like a lot to take in. We added boolean expressions, blocks, and the if statement, but hopefully it feel straightforward.  Each time we added a new language feature we implemented them in the same way: define what we want, add a new grammar rule, create a new AST class, add an action to the semantics, and add a test case. Languages can be complex, so this  approach of carefully adding code and tests keeps the project organized and understandable.












