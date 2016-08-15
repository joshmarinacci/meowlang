# Building Meow, a Complete Language in < 200 LOC


Welcome back. In blog one we introduced Ohm, a tool for easily building parsers in JavaScript, and build
code to parse numbers in various formats. In blog two, we turned our parser into a real arithmetic
language with binary operations and symbols.  Finally in this blog we will complete our language
with conditionals, loops, and user defined functions.

# Code Cleanup

The first thing our language needs is a name. I'm a fan of cats, but Cat and Kitty are already used
by [existing]() [languages]() so I'm going to call this language Meow. Before we dive into the missing features,
let's do a little refactoring.  Move all of the AST classes into a file called `ast.js`. NodeJS doesn't support 
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












