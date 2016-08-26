"use strict";

var AST = require('./ast');

module.exports.make = function(semantics) {

    var Calculator = semantics.addOperation('calc', {
        Add: function (a,_,b) {
            return a.calc() + b.calc();
        },
        Sub: function (a, _, b) {
            return a.calc() - b.calc();
        },
        Mul: function (a, _, b) {
            return a.calc() * b.calc();
        },
        Div: function (a, _, b) {
            return a.calc() / b.calc();
        },
        Group: function (_1, a, _2) {
            return a.calc();
        },


        int: function (a) {
            return parseInt(this.sourceString, 10);
        },
        float: function (a, b, c, d) {
            return parseFloat(this.sourceString);
        },
        hex: function (a, b) {
            return parseInt(this.sourceString.substring(2), 16);
        },
        oct: function (a, b) {
            return parseInt(this.sourceString.substring(2), 8);
        }
    });


    var ASTBuilder = semantics.addOperation('toAST', {
        Add: (a, _, b) => new AST.BinOp('add', a.toAST(), b.toAST()),
        Sub: (a, _, b) => new AST.BinOp('sub', a.toAST(), b.toAST()),
        Mul: (a, _, b) => new AST.BinOp('mul', a.toAST(), b.toAST()),
        Div: (a, _, b) => new AST.BinOp('div', a.toAST(), b.toAST()),
        Eq: (a, _, b)  => new AST.BinOp('eq', a.toAST(), b.toAST()),
        Neq: (a, _, b) => new AST.BinOp('neq', a.toAST(), b.toAST()),
        Gt: (a, _, b)  => new AST.BinOp('gt', a.toAST(), b.toAST()),
        Lt: (a, _, b)  => new AST.BinOp('lt', a.toAST(), b.toAST()),
        Gte: (a, _, b) => new AST.BinOp('gte', a.toAST(), b.toAST()),
        Lte: (a, _, b) => new AST.BinOp('lte', a.toAST(), b.toAST()),
        Group: (_, a, __) => a.toAST(),
        Assign: (a, _, b) => new AST.Assignment(a.toAST(), b.toAST()),
        Block: (_, body, _1) => new AST.Block(body.toAST()),
        IfExpr: (_,cond,thenBlock,__,elseBlock) => {
            var thenBody = thenBlock.toAST();
            var elseBody = elseBlock ? elseBlock.toAST()[0] : null;
            return new AST.IfCondition(cond.toAST(), thenBody, elseBody);
        },
        WhileExpr: (_, cond, body) => new AST.WhileLoop(cond.toAST(), body.toAST()),
        FunCall: (funName,_1,args,_2) => new AST.FunctionCall(funName.toAST(), args.toAST()),
        Arguments: (a) => a.asIteration().toAST(),
        FunDef: (_1, name, _2, params, _3, block) => new AST.FunctionDef(name.toAST(), params.toAST(), block.toAST()),
        Parameters: (a) => a.asIteration().toAST(),
        Identifier: function (a, b) {
            return new AST.MSymbol(this.sourceString, null)
        },
        //reuse the number literal parsing code from `calc` operation
        Number: function (a) {
            return new AST.MNumber(a.calc());
        },
        String: (a, text, b) => new AST.MNumber(text.sourceString)
    });

    return {
        Calculator:Calculator,
        ASTBuilder:ASTBuilder
    }
};

