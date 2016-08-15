"use strict";

var AST = require('./ast');

module.exports.make = function(semantics) {

    var Calculator = semantics.addOperation('calc', {
        AddExpr: function (a) {
            return a.calc();
        },
        AddExpr_plus: function (a, _, b) {
            return a.calc() + b.calc();
        },
        AddExpr_minus: function (a, _, b) {
            return a.calc() - b.calc();
        },
        MulExpr: function (a) {
            return a.calc();
        },
        MulExpr_times: function (a, _, b) {
            return a.calc() * b.calc();
        },
        MulExpr_divide: function (a, _, b) {
            return a.calc() / b.calc();
        },
        PriExpr_paren: function (_1, a, _2) {
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
        AddExpr_plus: (a, _, b) => new AST.BinOp('add', a.toAST(), b.toAST()),
        AddExpr_minus: (a, _, b) => new AST.BinOp('sub', a.toAST(), b.toAST()),
        MulExpr_times: (a, _, b) => new AST.BinOp('mul', a.toAST(), b.toAST()),
        MulExpr_divide: (a, _, b) => new AST.BinOp('div', a.toAST(), b.toAST()),
        PriExpr_paren: (_, a, __) => a.toAST(),
        Assign: (a, _, b) => new AST.Assignment(a.toAST(), b.toAST()),

        Identifier: function (a, b) {
            return new AST.MSymbol(this.sourceString, null)
        },
        //reuse the number literal parsing code from `calc` operation
        Number: function (a) {
            return new AST.MNumber(a.calc());
        }
    });

    return {
        Calculator:Calculator,
        ASTBuilder:ASTBuilder
    }
};

