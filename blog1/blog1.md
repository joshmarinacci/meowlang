 what's a parser
 why you need it
examples that use a parser
new fileformat has come along that you need to parse
find files in an old format and no one has written a parser already, or they are buggy or not the platform you need
something more complex than a regex can handle
create syntax highlighting for a language
you want to *do* something with the parsed data. like evaluate an expression

the point is parsers are a fundamental part of CS but they have been so hard to build that only advanced compiler developers make them
the tools are typically tricky, and don't mesh well with the language you use. very hard to debug.

imagine if your description of a file format was *also* the parser? why write it twice.


Ohm, a new kind of parsing system.
you write your syntax in a very flexible syntax in a .ohm file, then attach semantic meaning to it using
your host language. in this case JavaScript.
ohm is based on ometa and years of research into making parsers easier and more flexible.
STEPS program used many custom languages for specific tasks (like a full paralleizeable graphics renderer in 400 LOC)
using a precursor to Ohm, ometa.

ohm vs other systems: semantics are separate from the grammar so you can have lots. do different things with the same
grammar. ex: syntax highlighting vs bug detection vs interpreter impl vs compiler
simple example: let's parse some numbers. But let's do it for real. ints and floats. hex and octal. scientific
notation. leading negative digit.  how would you write code to do this by hand? it'd be super buggy. lots of
special cases which sometimes conflict with each other. regex would be super ugly. let's do it with ohm.
 
  three steps:
   build a syntax in ohm
   build the semantics
   build a test function. test string and what it should resolve to
 
  add more features and keep testing

first let's build a simple syntax. put this into syntax1.ohm
```
CoolNums {
   // just a basic integer
   Number = digit+
}
```

this creates a single rule: `Number`, which matches one or more digits
the `+` means one or more, just like in a regular expression.
This means if there is one digit or more than
one digit it will match. If there is zero digits, or something other than
a digit, then it will fail. digit is defined as the characters foor
the numbers 0 to 9.  digit is also a rule but it's built in so we don't
have to define it ourselves. we could override if it we wanted to
however, though it's not that common. after all we don't plan
to invent a new form of number (yet!)


Now we need to read in this grammar and process it with the Ohm library.

Put this into test1.js

```
var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var grammar = ohm.grammar(fs.readFileSync('src/blog_numbers/syntax1.ohm').toString());
```

ohm.grammar will read in the file and parse it into a grammar object. Now
we can add semantics.  Add this to your file:

```
var sem = grammar.semantics().addOperation('toJS', {
    Number: function(a) {
        return parseInt(this.interval.contents,10);
    }
});
```


This creates a set of semantics called `sem` with the operation `toJS` which will do something with the
parsed file.  A semantics is essentially a bunch of functions matching up to each rule in the grammar. 
Each function will be called with the corresponding rule in the grammar is called.  In this case the rule Number
will invoke our Number function.  Our function can do anything we want, like print debugging information, create
objects, or recursively call `toJS` on any sub nodes. In this case we just want to convert the matched text into a
real Javascript integer.  

All semantic functions have an implicit `this` object with some useful properties. The `interval` property represents
the part of the input text that matches this node.  `this.interval.contents` is the matched input as a string. Calling
the built in JavaScript funciton `parseInt` turns this string to a number. The `10` argument to parseInt tells JavaScript
that we are giving it a number in base ten decimal. If we leave it out then JS will assume it's base 10 anywya, but I've
included it because later on we will support base 16 (hex) numbers, so it's good to be explicit.

Now that we have some semantics, let's actually parse something to see if our parser works. How do we know our parser
works? By testing it. Lots and lots of testing. Every possible edge case needs a test. With the standard `assert` API,
here is a test function which matches some input then applies our semantics to it to turn it into a number, then
compares the number with the expected input.

```
    function test(input, answer) {
     var match = grammar.match(input);
     if(match.failed()) return console.log("input failed to match " + input + match.message);
     var result = toJS(match).toJS();
     assert.deepEqual(result,answer);
     console.log('success = ', result, answer);
    }
```

That's it. Now we can write a bunch of tests for different numbers. If the match fails then our script
will throw an exception. If not it will print success. Let's try it out.  Add this to the script

```
    test("123",123);
    test("999",999);
    test("abc",999);
```

Then run the script with `node src/blog_numbers/test1.js`

Your output should look like this:


```
success =  123 123
success =  999 999
input failed to match abcLine 1, col 1:
> 1 | abc
      ^
Expected a digit
```

Cool. The first two succeed and the third one fails. Even better, Ohm automatically
gave us a nice error message pointing to the match failure.


Our parser works, but it doesn't do anything very interesting. Let's extend it to parse
both integers and floating point numbers.  Change the grammer to look like this:

```
CoolNums {
  // just a basic integer
  Number = float | int
  int    = digit+
  float  = digit+ "." digit+
}
```

This changes Number to point to either a float or an int. The `|` means or. We read
this as "A number is a float or an int".  Then int is defined as digit+ and float
is defined as digit+ followed by a period followed by another digit+.  This means
there must be at least one digit before the period and at least one after. If there
is not a period then it won't be a float at all, so 'int' will match instead.

Now let's go look at our semantic actions again.  Since we now have new rules
we need new action functions: one for int and one for float.

```
var toJS = grammar.semantics().addOperation('toJS', {
    Number: function(a) {
        return a.toJS();
    },
    int: function(a) {
        console.log("doing int", this.interval.contents);
        return parseInt(this.interval.contents,10);
    },
    float: function(a,b,c) {
        console.log("doing float", this.interval.contents);
        return parseFloat(this.interval.contents);
    }
});
```

There's two things to note here. First, int and float adn Number all have matching
grammar rules and functions. However, the action for Number doesn't really do anything
It receives the child node 'a' and returns the result of toJS on the child. In 
other words the Number rule simply returns whatever child rule matched.  Since this is
the default behavior or any rule in Ohm we can just leave the Number aciton out. Ohm
will do it for us.

Second, int has one argument 'a' while float has three: 'a', 'b', and 'c'.  This is
because of the rule's arity. Arity means how many arguments a rule has. If we look
back at the grammar the rule for 'float' is

```
  float  = digit+ "." digit+
```

float is define by three parts, the first `digit+`, the `"."` and the second `digit+`. 
We can read this as : a float is composed of three parts.  All three of those
parts will be passed as parameters to the action function for float. 
Thus float must have three arguments or else the Ohm
library will give us an error.  In this case we don't care about the arguments, we will
just grab the input string directly, but we still need the arguments listed to avoid
compiler errors. Later on we will actually use some of these parameters.

Now we can add a few more tests for our new floating point number support.

```
test("123",123);
test("999",999);
//test("abc",999);
test('123.456',123.456);
test('0.123',0.123);
test('.123',0.123);
```

Note that the last test will fail. A floating point number must begin with a digit, even
if it's just zero. .123 is not valid, and in fact the JavaScript language has the same rule.


So now we have integers and floats, but there's a few other number syntaxes
that might be good to support.  Hex and scientific notation.  Hex numbers are
integers in base sixteen. The digits can be from 0 to 9 and A to F. Hex is often
used in computer science when working with binary data.  


In most C derived programming languages (including JavaScript) 
Hex numbers are usually preceeded by `0x` to indicate to the compiler
that what follows is a hexadecimal number. To support hex numbers in our
parser we just need to add another rule and modify Number to recognize it as
another option.


```
  Number = hex | float | int
  int    = digit+
  float  = digit+ "." digit+
  hex    = "0x" hexDigit+
  hexDigit := "0".."9" | "a".."f" | "A".."F"
```


I've actually added two rules. `hex` says that a hex number is the string `0x` followed
by one or more `hexDigit`s. A `hexDigit` is any letter from 0 to 9, or a to f, 
or A to F (covering both upper and lower case).   
 
Now we just need another action rule for hex

```
    hex: function(a,b) {
        console.log("doing hex", this.interval.contents);
        return parseInt(this.interval.contents,16);
    }
```

Notice that in this case we are passing 16 has the radix to parseInt because
we want JavaScript to know that this is a hexadecimal number.

I skipped over something important to notice. The rule for hexDigit looks like this. 

```
  hexDigit := "0".."9" | "a".."f" | "A".."F"
```

Notice that I used `:=` instead of `=`.  In Ohm, the := is used when you are overriding
a rule. It turns out Ohm already has a default rule for 'hexDigit', just as it does
for `digit`, `space` and a bunch of others.  If I had used just `=` then Ohm would
have reported an error. This way I can't override a rule unintentionally.  Since
our new hexDigit rule is actually the same as Ohm's built in hexDigit rule we can just
comment it out. I put it in just so we can see what's really going on.

Now we can add some more tests and see that our hex digits really work:

```
test('0x456',0x456);
test('0xFF',255);
```



Finally let's add scientific notation support. This is for very large or small
numbers like 1.8 x 10^3  In most programming languages this would be written
as 1.8e3 for 18000 or 1.8e-3 for .0018.   Let's add another couple of rules to
support this expontent notation

```
    float  = digit+ "." digit+ exp?    
    exp    = "e" "-"? digit+
```

This adds a the `exp` rule to the end of the float rule with a question mark.
The `?` means zero or one, so `exp` is optional but there can't be more than one.
Adding the `exp` rule also changes the arity of the float rule, so we need to add
another argument to the float action, even if we don't use it.

```
    float: function(a,b,c,d) {
        console.log("doing float", this.interval.contents);
        return parseFloat(this.interval.contents);
    },
```

And now our new tests can pass:

```
test('4.8e10',4.8e10);
test('4.8e-10',4.8e-10);
```



Ohm is a great tool for building parsers because it's easy
to get started and you can incrementally add to it. It also
has other great features that I didn't cover today, like a debugging
visualizer and subclassing.  

So far we have used Ohm to translate character strings into JavaScript numbers,
and often Ohm is used for this very purpose: converting one representation to another.
However, Ohm can be used for a lot more. By putting in a different set of semantic
actions you can use Ohm to actually process and calculate things.

In the next article of this series I'll show you how to 
not just parse numbers but actually evaluate math expressions like
`(4.8+5 * (238-68)/2)`, like a real calculator.

Bonus challege: Can you extend the grammar with support for octal numbers? These
are numbers in base 8 and can be represented with only the digits 0 to 7, preceeded
by a zero and the letter `o`.  See if you are right with these test cases

```
test('0o77',7*8+7);
test('0o23',0o23);
```

















 
 
 


