# Ohm: Build a Calculator


[Last time](link) I introduced Ohm, an open source meta language parser with an easy to use syntax. We built a parser for different number formats.  This week we will extend the parser to calculate arithmetic expressions.

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

The above code is all we need to define full arithmetic with parenthesis and precedence. This is a bit complicated so let's break it down into pieces. We can read the grammar like this: `Expr` is defined as an additive expression. An additive expression can be one of an addition, subtraction, or a multiplication expression. A multiplication expression can be one of times, divide or a primary expression. A primary expression is an expression (`Expr`) inside parenthesis or a number.

At first this looks very strange.  Why is the general expression (`Expr`) only
an additive expression, and is AddExpr just the first line or all three lines? And how would we write this from scratch if we didn't know how to do it beforehand?

## Compound Expressions

Ohm supports a compound syntax to let you define multiple rules at once. Adding a `--` after a rule makes it a sub-rule with alternation. An alternation means something *or* something else.
 
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

In other words there are three forms of the `AddExpr`: the plus form, the minus form, or a multiplication form. Rather than having to break them out separately Ohm lets us combine them into a more compact and cleaner syntax.  We still read it as:  'an _add_ expression can be one of _add plus mul_ or _add - mul_ or just _mul_.'


## Operator Precedence

Second, why do we need to group the plus and minus versions of add together, separate from the times and divide forms?  This comes down to operator precedence.

Consider the following expression:

```
4 + 5 * 6
```

Do you evaluate the + or the * first? The order in which we execute the operators affects the final answer. In many programming languages (including JavaScript)  there is a defined operator precedence order. Usually multiplication and division come before addition and subtraction.  So the expression above is equivalent to:

```
4 + (5*6)
```

However, some programming languages, like Smalltalk, evaluate operators
left to right *without* any precedence. So the expression above would be equivalent to:

```
(4+5) * 6
```

For this calculator we will go with the JavaScript form of precedence. We must group the multiplication and division together and make sure they are executed before the addition and subtraction. That's why Expr is made up of AddExpr, and AddExpr contains MulExpr, and MulExpr contains the PriExpr. Only in PriExpr do we get to actual numbers.  This seems backwards. If MulExpr comes first then why is is listed after AddExpr? We need to consider how things will be evaluated.  4 + 5 * 6 will be parsed into this:

```
Add(4, Mul(5,6))
```

The *innermost* expression is evaluated first, so the MulExpr must be closest to Number.  Adds will be evaluated only after all the Muls are done. We define Add add in terms of Mul because Add will always contain Mul. Mul will never contain Add (without parenthesis). 

I realize this is tricky to understand, and honestly it's one of the reasons I prefer Smalltalk's approach of left to right.  In general you only need to implement this once and it's common to just borrow from another grammar that get's it right. I've adapted this one from the official [Ohm Math](https://github.com/cdglabs/ohm/blob/master/examples/math/index.html) example.

## Performing Arithmetic

Now that we have a parser that we *know* processes things in the right order we can actually do some arithmetic. As we discussed last time, the _grammar_ just parses text into a tree without actually doing any work. The _semantics_ define the real actions which do things. Each action function will perform an operation on the results of it's sub nodes.  So 4+5 will add the 4 and 5 nodes together. Each of those nodes is an int which returns a real JS number.

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


The first actions are the only new ones. The others are the same ones from the last blog, they parse all of the forms of numbers (integers, floating point, hexadecimal, and octal).


That's actually it.  Just do the basic math for each expression.  Of course, 
if we just built a simple calculator we wouldn't be using the full power of Ohm. 
Instead of evaluating an arithmetic expression, let's generate code in a 
completely different language to do it for us.  Let' make a new set of semantics 
which convert this math into Java code.  Then we will have created an actual 
language [transpiler](https://en.wikipedia.org/wiki/Source-to-source_compiler).


