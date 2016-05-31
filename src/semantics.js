/**
 * Created by josh on 5/25/16.
 */
var Objects = require('./objects');
var util = require('util')

module.exports = {
    load: function(gram) {
        return gram.semantics().addOperation('toAST', {
            int: function (a) {          return new Objects.KLInteger(parseInt(this.interval.contents, 10));   },
            float: function (a, _, b) {  return new Objects.KLFloat(parseFloat(this.interval.contents, 10));   },
            ident: function (a, b) {     return new Objects.KLSymbol(this.interval.contents, null);            },
            str: function (a, text, b) { return new Objects.KLString(text.interval.contents);                  },

            AddExpr: function (a, _, b) {      return new Objects.MethodCall(a.toAST(), 'add', b.toAST());       },
            MulExpr: function (a, _, b) {      return new Objects.MethodCall(a.toAST(), 'multiply', b.toAST());  },
            LtExpr: function (a, _, b) {       return new Objects.MethodCall(a.toAST(), 'lessThan',b.toAST());   },
            LteExpr: function (a, _, b) {      return new Objects.MethodCall(a.toAST(), 'lessThanEqual',b.toAST());  },
            GtExpr: function (a, _, b) {       return new Objects.MethodCall(a.toAST(), 'greaterThan',b.toAST());    },
            GteExpr: function (a, _, b) {      return new Objects.MethodCall(a.toAST(), 'greaterThanEqual',b.toAST());  },
            EqExpr: function (a, _, b) {       return new Objects.MethodCall(a.toAST(), 'equal',b.toAST());      },
            NeExpr: function (a, _, b) {       return new Objects.MethodCall(a.toAST(), 'notEqual',b.toAST());   },
            DefVar: function (_, ident) {       return ident.toAST();   },
            FunCall: function (a, _1, b, _2) {  return new Objects.FunctionCall(a.toAST(), b.toAST());           },
            Arguments: function (a) {           return a.asIteration().toAST();           },
            Parameters: function (a) {          return a.asIteration().toAST();           },
            DefFun: function(_,ident,_,args,_,block) {     return new Objects.FunctionDef(ident.toAST(), args.toAST(), block.toAST());        },
            Block: function (_1, b, _2) {       return new Objects.Block(b.toAST());           },
            AssignExpr: function (a, _, b) {    return new Objects.MethodCall(a.toAST(), 'assign',b.toAST());            },
            WhileExpr: function (_, a, b) {     return new Objects.WhileLoop(a.toAST(), b.toAST());           },
            IfExpr: function (_, a, b) {        return new Objects.IfCond(a.toAST(), b.toAST());            }
        });
    }
};