/**
 * Created by josh on 5/23/16.
 */

var ohm = require('ohm-js');
var fs = require('fs');
var Objects = require('./objects');


//load the grammar
var myGrammar = ohm.grammar(fs.readFileSync('src/grammar2.ohm').toString());

//add 'eval' semantics
var sem = myGrammar.semantics().addOperation('toAST',{
    AddExpr: function(a,_,b) {
        console.log("add");
        return {
            type:'method',
            object: a.toAST(),
            method:"add",
            argument: b.toAST()
        };
    },
    MulExpr: function(a,_,b) {
        console.log("mul");
        return {
            type:'method',
            object: a.toAST(),
            method:"multiply",
            argument: b.toAST()
        };
    },
    DivExpr: function(a,_,b) {
        return {
            type: 'method',
            object: a.toAST(),
            method:'divide',
            argument: b.toAST()
        }
    },
    Group: function(_1,a,_2) {
        return a.toAST();
    },
    lit: function(a) {
        return { type:'integer', value:parseInt(this.interval.contents,10)};
    }
});


function evalAST(ast) {
    if(ast.type == 'integer') {
        return Objects.Integer.make(ast.value);
    }
    if(ast.type == 'method') {
        var obj = evalAST(ast.object);
        var arg = evalAST(ast.argument);
        return obj[ast.method](arg);
    }
}

function test(input, answer) {
    var match = myGrammar.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var ast = sem(match).toAST();
    console.log('ast = ', ast);
    var result = evalAST(ast);
    //console.log('result is',result);
    if(result.type == 'Integer') {
        if(result.jsEquals(answer)) {
            return console.log("correct : " + input + " = " +  answer);
        } else {
            return console.log("incorrect : " + input + " != " + answer, result);
        }
    }
    console.log("unknown result type", result);
}

//test('4+5+6',15);
//test('4*5',20);
//test('4/2',2);
//test('4*5/2',10);
test("4+5*2",18);
//test("4+(5*2)",14);


/*

(4.add(5)).mul(2)

4+5+6 =>   4.add(5) rest
[4,method,'add',5,method,'add',6]
do the first four, concat w/ rest
[9,method,'add',6]
do the first four, concat w/ rest
[15]

4+(5*2) =>
  [4,method,add,[5,method,mul,2]]
do the first four, see value is an array, push to stack, evaluate the array
[5,method,mul,2]
do the first four, concat w/ rest
[10]
pop from stack
[4,method,add,10]
do the first four, concat w/ rest
[14]




 */