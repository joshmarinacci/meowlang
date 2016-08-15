Last time we worked with numbers and arithmetic. Parsing math expressions is one of the most common things you will ever do with a parser, and there are lots of examples for it. So this week I thought we'd do something completely different. Let's write some parsers for common file formats based on their actual specs.

We'll start with a simple one. INI files. Sure there are existing libraries out there to do it for you, but with such a simple file format we can build it ourself in just a few minutes.

talk about the wikipedia page


Ini is a pretty simple format. Every line is either a comment, a key value pair, or a section header.  Let's start with comment lines.  

A comment starts with a semicolon `;`. Anything after the semicolon up to
the end of the line is a comment and should be ignored. So we want
to look for semicolon followed by anything, followed by eol. Here's the basic syntax.

```
IniFormat {
  line = comment
  comment = ";" any* eol
  eol = "\n"
}
```

This won't actually work, however.  The parser will see the semicolon, followed by an unlimited number of things that match `any`, which is of course everything... including the `eol`. The parser will either consume all input without fully matching anything, producing an error, or else it will go into an infinite loop. Oops!  

So really we don't want to match anything, we want to match anything except for `eol`. That's easy to fix:

```
IniFormat {
  line = comment
  comment = ";" (~eol any)* eol
  eol = "\n"
}
```

Now the middle section reads: match something that is not eol and is anything. the `~` means not. The `not` rule doesn't actually consume any input, it just determines if the parser will continue to the next section (`any`), or jump to after the `*` (to the `eol`).

Now our test should work:

```
test(";Kilroy wuz here!\n");
```


Onward. Now let's handle the section header case. According to the spec the section header is an open square bracket, followed by anything, followed by the close square bracket.  Using what we learned about about handling the eol case,
we can write the rule like this:


```
    section = "[" (~"]" any)* "]"
}
```

Read this as open square bracket, followed by zero or more things that aren't a closed square bracket, followed by a closed square bracket. And of course we update line to cover this new option:

```
IniFormat {
  line = comment | section
...
```

Now another test:

```
test("[header]\n");
test("[footer]");
```

Finally our key value pairs. A key pair is a key followed by the equals sign followed by a value. So this rule:

```
keypair = key "=" value eol
```
A key is a sequence of one or more letters:

```
key = letter+
```

And the value can be anything that's not eol

```
value = (~eol any)+
```

Now our final grammar looks like this:

```
IniFormat {
    line = comment | keypair | section
    comment = ";" (~eol any)* eol
    keypair = key "=" value eol
    key = letter+
    value = (~eol any)+
    section = "[" (~"]" any)* "]"
    eol = "\n"
}
```


Of course parsing the file only tells us that it's a valid INI file. We need some semangics to do something with it.  Let's turn it into a simple JavaScript structure with the comments stripped out.  This set of semantics will do that:

```
var IniParser = grammar.semantics().addOperation('parse', {
    comment: function(a,b,c) {
        return b.parse().join("");
    },
    keypair: function(key, _, value, eol) {
        return {
            key: key.parse().join(""),
            value: value.parse().join("")
        }
    },
    section: function(a,b,c) {
        return { type:"section", name:b.parse().join("") };
    },
    _terminal: function() { return this.primitiveValue; }
});
```

We can call the semantics as before with IniParser(match).parse();

```
function test(input, answer) {
    var match = grammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = IniParser(match).parse();
    console.log('success = ', result, answer);
    assert.deepEqual(result,answer);
}

test(";foo\n","foo");
test("foo=bar\n",{key:'foo',value:'bar'});
test("[some stuff]",{ type:"section", name:"some stuff"});
```
