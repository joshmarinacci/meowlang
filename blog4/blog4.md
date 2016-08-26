# A programming language in 200 lines

while loop


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

comments

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


So far we have only worked with numbers. Our original design was for a calculator, after all. But now
that we want to build Meow into a full language we need string literals.
string literals



function call to native function

more tests

user defined function





