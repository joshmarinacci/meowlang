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





comments

string literals

function call to native function

more tests

user defined function





