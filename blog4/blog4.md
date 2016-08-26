# Meow: A Programming Language in 180 lines



# Adding the While Loop


```
{
    x = 0
    while { x < 5 } {
        x = x + 1
    }
}
```

add WhileExpr to grammar.ohm

```
    Expr =  WhileExpr | IfExpr | Block | Assign | MathOp | Group | Identifier | Number
```

add WhileLoop to ast.js

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


add WhileExpr to semantics.js

```
        WhileExpr: (_, cond, body) => new AST.WhileLoop(cond.toAST(), body.toAST()),
```


add new unit tests


```
//while loop
test('{ x=0  while { x < 5 } { x = x+1 } } ',5);
test('{ x=4  while { x < 5 } { x = x+1 } } ',5);
test('{ x=8  while { x < 5 } { x = x+1 } } ',null);
```


Now let's add a few other missing parts: comments and string literals

# Line Based Comments

You may remember from the first blog in this Ohm series that rules which
begin with capital letters automatically handle whitespace. When you declare
a rule like  
```
Expr = WhileExpr | IfExpr
```
 
it's really doing something like this:

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
string literals


add to the grammar string literals

```
    Expr =  WhileExpr | IfExpr | Block | Assign | MathOp | Group | Identifier | Number | String
...
    Term = Group | Identifier | Number | String
...    
    qq = "\""
    String = qq (~qq any)+ qq
```


add new action the semantics. uses the increasingly miss named MNumber class
```
        String: (a, text, b) => new AST.MNumber(text.sourceString)
```

more unit tests

```
//string literals
test(' "foo" ',"foo");
test(' "foo" + "bar" ', "foobar");
```




# Function Calls

now let's add the ability to call functions.
 
a function call can take the place of any standard terminal expression (number, identifier, etc) so let's update
Term to support FunCall. The FunCall itself is an identifier followed by arguments in parenthesis.

``` 
    Term = Group | FunCall | Identifier | Number | String
     ...

    FunCall = Identifier "(" Arguments ")"
    Arguments = ListOf<Expr, ",">
```

 
Now let's build an AST object to represent function calls

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

Of course we don't have any functions to call yet. We don't ahve a syntax to define new functions yet, so let's
pre-fill the global scope with some functions written in javascript instead of Meow.

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

Print will print it's first argument and max will return the larger of the two arguments.  Now we can write
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


So far so good. Everything we've implemented has the same structure as previous features. We extend the grammar,
add an AST object (if necessary), add an action, the put in more tests. User defined functions will be a little bit harder, however.


# User Defined Functions

User defined functions are functions created in the Meow language rather than in native Javascript.  In Meow
we define a function with the `fun` keyword like this:


```
 
    fun plus1(z) { 
       1+z 
    } 
    
    plus1(9)

```

The body of a function is just a block. As we defined earlier, a block is a sequence of statements that returns the
value of the last one. This implicit return means we don't need to have an explicit `return` keyword. The code
above will return 1 plus the z argument.  This is the grammar update for function definitions. 


```
    Expr =  FunDef | WhileExpr | IfExpr | Block | Assign | MathOp | Group | Identifier | Number | String

    FunDef  = "fun" Identifier "(" Parameters ")" Block
    Parameters = ListOf<Identifier, ",">
```

These two new rules new new semantic actions of course:

```
        FunDef: (_1, name, _2, params, _3, block) => new AST.FunctionDef(name.toAST(), params.toAST(), block.toAST()),
        Parameters: (a) => a.asIteration().toAST(),
```


So far we have built the FunDef feature the same as previous features. Here's where it gets tricky: scope.
The function has direct access to the variables passed in as parameters, but it *also* has access to variables
defined outside the function, unless one of the parameters has the same name.  To build this properly we need
to expand the definition of scope.  

A scope is a list of names which map to values using symbols. A scope also has a *parent* scope. If a symbol
can't be found in the scope then it will ask it's parent for the value instead.  This implements the nested
scope rules for functions.  So we need to update the Scope class accordingly:


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


Now we can make the FunctionDef AST object:

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
resolution *when the function is called* not when it is declared.  To do this we will use
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




 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
