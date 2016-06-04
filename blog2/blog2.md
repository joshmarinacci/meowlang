last time I introduced Ohm, an open source meta language parser
with an easy to use syntax. We built a parser for various
kinds of numbers.  This week we will extend the parser
to calculate arithmetic expressions.

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


this is a bit complicated so let's break it down into pieces.
expr can be an additive expression, an additive expression
can be addition, subtraction, or a multiplicitive expression.
a multiplicitive expression is times, divide or a primary expression.
the primary expression is an expression inside parenthesis or a number.

At first this looks very strange.  why is the general expression only
an additive expression, and is AddExpr just the first line or all three lines?

Ohm supports a compound syntax lets you define multiple rules at once.

  AddExpr = AddExpr "+" MulExpr -- plus
          | AddExpr "-" MulExpr -- minus
          | MulExpr

is the same as

AddExpr        = AddExpr_plus | AddExpr_minus | MulExpr
AddExpr_plus   = AddExpr "+" MulExpr
AddExpr_minus  = AddExpr "-" MulExpr

In other words there are three forms of the add expression. Rather than having
to break them out separately Ohm lets us combine them into a more compact
and cleaner syntax.

Second, why do we need to group the plus and minus versions of add together, seprate
from the times and divide forms?  This comes down to operator precedence. 

Consider the following expression:

4 + 5 * 6

Do you evaluate the + or the * first? Which order we do the operators 
affects the final answer. In many programming languages (including JavaScript)
 there is a 
defined operator precedence order. Usually multiplication and division
come before addition and subtraction.  So the expression above is
equivalent to 

4 + (5*6)

However, some programming languages, like Smalltalk evaulate operators
left to right. So the expression above would be equivalent to:

(4+5) * 6

For this calculator we will go with the javaScript form. So now we must group
the mulpication and division together and make sure they are executed before
the addition and subtraction. That's why Expr is made up of AddExpr, and AddExpr
contains MulExpr, and MulExpr contains the PriExpr. Only in PriExpr do we get
to actual numbers.   This seems backwards, but we need to consider how things
will be evaluated.  4 + 5 * 6 will be parsed into this:

Add(4, Mul(5,6))

The inner most expression is evaluated first, so the MulExpr must be closest
to Number.  Adds will be evaulated only after all Mul's are done.

I realize this is tricky to understand, and honestly it's one of the reasons I prefer
Smalltalk's approach of left to right.  In general you only need to implement this once
and it's common to just borrow from another grammar that get's it right. I've adapted
this one from the official Ohm Math example.


Now that we have a parser that we know processes things in the right order we can actually do
some arithmetic.  Each action function will just perform an operation on the results of it's
sub nodes.  So 4+5 will add the 4 and 5 nodes together. Each of those is an int which just returns
a real JS number. 

Here's what the actions look like for arithemtic

```
var Calculator = grammar.semantics().addOperation('calc', {
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
        return parseInt(this.interval.contents,10);
    },
    float: function(a,b,c,d) {
        return parseFloat(this.interval.contents);
    },
    hex: function(a,b) {
        return parseInt(this.interval.contents.substring(2),16);
    },
    oct: function(a,b) {
        return parseInt(this.interval.contents.substring(2),8);
    }
});
```


The first actions are the only new ones. The others are existing from the last blog, they parse all of the forms
of numbers.


That's actually it.