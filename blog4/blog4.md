# Meow: A Programming Language in 180 lines

In previous blogs in this series we learned how to use Ohm to parse numbers, build an expression tree,
and process blocks of code with conditionals. In this final fourth part of the Ohm series we will finish 
up our complete programming language, Meow, with looping and real function calls. Thanks to the power of Ohm
our final language will be implemented in only 180 lines of code.




# Adding the While Loop

Now that we have conditionals and blocks would could write a loop by hand with just an if statement and a counter
variable, but most languages provide a proper _while_ loop.  Since we already implement block last time, the while loop will
be simple to build. It is the keyword `while` followed by a condition block that resolves to true or false (a boolean), followed by
a body block which is executed until the condition block returns false.  The while loop itself will resolve to the last
value from the body.

This is a simple example of a while loop in action.


```
{
    x = 0
    while { x < 5 } {
        x = x + 1
    }
}
```


Let's start by adding a While expression to the grammar in `grammar.ohm`.

```
    Expr =  WhileExpr | IfExpr | Block | Assign | MathOp | Group | Identifier | Number

    WhileExpr = "while" Block Block
```

Then add a new `WhileLoop` class for our expression tree in `ast.js`. This class
executes the body block over and over until the condition resolves to false.

```
class WhileLoop {
    constructor(cond, body) {
        this.cond = cond;
        this.body = body;
    }
    resolve(scope) {
        var ret = new MNumber(null);
        while(true) {
            var condVal = this.cond.resolve(scope);
            if (condVal.jsEquals(false)) break;
            ret = this.body.resolve(scope);
        }
        return ret;
    }
}
```


Next add a new semantics action for the WhileExpr. This action just creates an instance
of the WhileLoop class above whenever a `while` rule is found in the code.

```
        WhileExpr: (_, cond, body) => new AST.WhileLoop(cond.toAST(), body.toAST()),
```


And finally we need some unit tests.


```
//while loop
test('{ x=0  while { x < 5 } { x = x+1 } } ',5);
test('{ x=4  while { x < 5 } { x = x+1 } } ',5);
test('{ x=8  while { x < 5 } { x = x+1 } } ',null);
```

Notice that the last test resolves to null. This is because x is already greater than five when the loop starts
so the body is never executed at all. The while loop must resolve to the last value of the body, but since the
body never executed either it return snull.




# Line Based Comments

Now let's add a few other missing parts of our language: comments and string literals

You may remember from the first blog in this series that rules which
begin with capital letters automatically handle whitespace. When you declare
a rule like this 
 
```
Expr = WhileExpr | IfExpr
```
 
Ohm is really doing something like this:

```
Expr = space* WhileExpr space* | space* IfExpr space*
```
 
Ohm handles the whitespace for us using a built in rule called `space`.  Normally `space`
just handles common whitespace characters like space, tab, and newlines, (which is also why
we don't need the semicolon for the end of lines). However, we can override the built in
space rule to make it also ignore comments.  Just add a few lines to the grammar file like this:


```
    // override space to include slash slash comments
    space := "\t" | " " | "\n" | comment
    comment = "//" (~"\n" any)*
```

Now any text on a line after the double slash (`//`) will be ignored.

# String Literals

So far we have only worked with numbers. Our original design was for a calculator, after all. But now
that we want to build Meow into a full language we need string literals.


Let's add string literals to the grammer with a new `String` rule. Strings must be between double quotes (").
Notice that the rule for String says it can be anything which isn't qq (the double quote). That means
it could even be a newline! Yes, multi-line string literals are valid in our language.

```
    Expr =  WhileExpr | IfExpr | Block | Assign | MathOp | Group | Identifier | Number | String
...
    Term = Group | Identifier | Number | String
...    
    qq = "\""
    String = qq (~qq any)+ qq
```


Now let's add a new action to the semantics for String. This action creates a new instance of MNumber from
the source string.  Now that we are using the MNumber class for booleans and strings, we should probably
rename it to something more general in the future, like MValue.

```
        String: (a, text, b) => new AST.MNumber(text.sourceString)
```

And of course a few more unit tests

```
//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");
```




# Function Calls

Now let's add the ability to call functions.  Arguably function calls are the only thing required for a language
to be a _real_ programming language. We could have implemented only function calls and built everything on top of
that (like LISP), but most real world programming languages use all of the other language features we built before.
With those in place we can now build function calls.

A function call can take the place of any standard terminal expression (number, identifier, etc) so let's update
`Term` to support `FunCall`. The `FunCall` itself is an identifier followed by its arguments in parenthesis.

``` 
    Term = Group | FunCall | Identifier | Number | String
     ...

    FunCall = Identifier "(" Arguments ")"
    Arguments = ListOf<Expr, ",">
```

Now let's build an expression class object to represent function calls

```
class FunctionCall {
    constructor(fun, args) {
        this.fun = fun;
        this.args = args;
    }
    resolve(scope) {
        //lookup the real function from the symbol
        var fun = scope.getSymbol(this.fun.name);
        //resolve the args
        var args = this.args.map((arg) => arg.resolve(scope));
        //execute the real javascript function
        return fun.apply(null,args);
    }
}
```

This code looks similar to what we've done for conditionals and loops. It is constructed from a symbol referring
to the function and the arguments that will be sent to the function. In the resolution phase the args are each
resolved, then the function is applied with these args.

Finally we can add the new semantic action rules.

```
    FunCall: (funName,_1,args,_2) => new AST.FunctionCall(funName.toAST(), args.toAST()),
    Arguments: (a) => a.asIteration().toAST(),
```

Of course we don't have any functions to call yet. We don't have a syntax to define _new_ functions yet, so let's
pre-fill the global scope with some hard coded functions written in plain Javascript.

```
var GLOBAL = new Scope(null);
GLOBAL.setSymbol(new MSymbol("print"),function(arg1){
    console.log("print:",arg1.val);
    return arg1;
});
GLOBAL.setSymbol(new MSymbol("max"), function(A,B) {
    if(A.val > B.val) return A;
    return B;
});
```

The `print` function will print it's first argument and `max` will return the larger of its two arguments.  Now we can write
some test functions.

```
//native function calls
test("print(4)",4); //returns 4, prints 4
test("max(4,5)",5); // returns 5
test('print("foo") ', 'foo');

// compound tests
// function returns value to math expression
test('6*max(4,5)',30);
test('max(4,5)*6',30);

test('4*max(4,5)',20);
test('4*max(5,4)',20);
// function returns value to function
test('max(4,max(6,5))',6);
test('max(max(6,5),4)',6);
```


So far so good. Everything we've implemented has the same structure as previous language features. We extended the grammar,
added an AST object (if necessary), added a semantic action, then put in more tests. 
User defined functions will be a little bit harder, however.


# User Defined Functions

User defined functions are functions created in the Meow language itself rather than in native Javascript.  In Meow
we will define a function with the `fun` keyword like this:


```
 
    fun plus1(z) { 
       1+z 
    } 
    
    plus1(9)

```

The body of a function is just a block. As we defined earlier, a block is a sequence of statements that returns the
value of the last one. This implicit return means we don't need to have a `return` keyword. The code
above will return 1 plus the z argument.  This is the grammar update for function definitions in `grammar.ohm`. 


```
    Expr =  FunDef | WhileExpr | IfExpr | Block | Assign | MathOp | Group | Identifier | Number | String

    FunDef  = "fun" Identifier "(" Parameters ")" Block
    Parameters = ListOf<Identifier, ",">
```

Our two new grammar rules need new semantic actions of course:

```
        FunDef: (_1, name, _2, params, _3, block) => new AST.FunctionDef(name.toAST(), params.toAST(), block.toAST()),
        Parameters: (a) => a.asIteration().toAST(),
```


So far we have built the `FunDef` feature the same as previous features but here's where it gets tricky: scope.
A function has direct access to the variables passed to it as parameters, but it *also* has access to variables
defined outside the function, unless one of the parameters has the same name.  To build this properly we need
to expand our definition of scope.  

A `Scope` is a list of names which map to values using symbols. A scope also has a *parent* scope. If a symbol
can't be found in the scope then it will ask it's parent for the value instead. If the parent can't find the symbol
then it will ask *its* parent, and so on up the chain until we get to the GLOBAL scope. 
To implement this we need to update the Scope class with new constructor, `getSymbol`, and 
`makeSubScope` functions.


```
class Scope {
    constructor(parent) {
        this.storage = {};
        this.parent = parent?parent:null;
    }
    setSymbol(sym, obj) {
        this.storage[sym.name] = obj;
        return this.storage[sym.name];
    }
    getSymbol(name) {
        if(this.storage[name]) return this.storage[name];
        if(this.parent) return this.parent.getSymbol(name);
        return null;
    }
    makeSubScope() {   return new Scope(this)  }
}
```


Now we can make the FunctionDef expression object:

```
class FunctionDef {
    constructor(sym, params, body) {
        this.sym = sym;
        this.params = params;
        this.body = body;
    }
```

When the function definition is resolved it will create a new symbol in its scope which points to the actual
function block. This function block will create a sub-scope for the function call, and fill
this scope with the values of the arguments.  This is dynamic, so we need to do the argument
resolution _when the function is called_ not when it is declared.  To do this we will use
a nested function like this:


```
    resolve(scope) {
        var body = this.body;
        var params = this.params;
        return scope.setSymbol(new MSymbol(this.sym.name),function() {
            var scope2 = scope.makeSubScope();
            params.forEach((param,i) => scope2.setSymbol(new MSymbol(param.name),arguments[i]));
            return body.resolve(scope2);
        });
    }
}
```

Now we can finally test a user defined function like this:

```
x = 5
fun plus1(z) {
  1+z
}
plus1(x)
```

To really test it, add this to the `test.js` file:

```
test('{ x=5  fun plus1(z){ 1+z }   plus1(x)  }', 6);
```


Note that I had to put {} around the code. This is because we have three 
top level statements: the variable assignment to `x`,  the function definition
of `plus1`, and the function *call* to plus1.  Everything in Meow is an expression
so we can't just have three statements hanging out there, they have to be inside of a
block, so the extra brackets do that. In the future we could make the top level brackets
implicit, but for now it's better to be explicit.

# Conclusion in 180 Lines

We now have a real language with conditionals, loops, and function calls. It has
enough power to write and execute real code. Anything else we want our language to do
should be possible just by creating more user defined functions.
 
I hope through this blog series you have seen both how powerful Ohm is, and how easy
it is to create your own language. Meow is currently 180 lines of code; and that's without
any crazy esoteric Javascript hacking. The implementation is very straight forward and
understandable.

From this base there are a lot of things you could
add to Meow. Experiment with new syntax, numbers with units, or asynchronous calls.
Embed it in a webpage or cross-generate code for an embedded processor. Almost anything
you want to do is just a few parser rules away.


Resources

github
ohm
ometa


 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
