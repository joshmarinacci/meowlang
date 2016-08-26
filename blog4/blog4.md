# A programming language in 200 lines



# while loop


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



now let's add a few other missing parts. comments and string literals

# comments

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




# function calls

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
add an AST object (if necessary), add an action, the put in more tests.



  
User defined functions will be a little bit harder, however.




user defined function





