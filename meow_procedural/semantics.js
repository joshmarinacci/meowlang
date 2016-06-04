/**
 * Created by josh on 6/4/16.
 */
var MO = require('./objects');
var MNumber = MO.MNumber;
var MBoolean = MO.MBoolean;
var MString = MO.MString;
var BinaryOp = MO.BinaryOp;
var MScope = MO.MScope;
var MSymbol = MO.MSymbol;
module.exports = {
    load: function (gram) {
        return gram.semantics().addOperation('toAST', {
            int: function (a) {
                return new MO.MNumber(parseInt(this.interval.contents, 10));
            },
            float: function (a, _, b) {
                return new MO.MNumber(parseFloat(this.interval.contents, 10));
            },
            str: function (a, text, b) {
                return new MString(text.interval.contents);
            },

            ident: function (a, b) {
                return new MSymbol(this.interval.contents, null);
            },

            AddExpr: function (a, _, b) {
                return new BinaryOp('add', a.toAST(), b.toAST());
            },
            MulExpr: function (a, _, b) {
                return new BinaryOp('mul', a.toAST(), b.toAST());
            },
            LtExpr: function (a, _, b) {
                return new BinaryOp('lt', a.toAST(), b.toAST());
            },
            GtExpr: function (a, _, b) {
                return new BinaryOp('gt', a.toAST(), b.toAST());
            },
            LteExpr: function (a, _, b) {
                return new BinaryOp('lte', a.toAST(), b.toAST());
            },
            GteExpr: function (a, _, b) {
                return new BinaryOp('gte', a.toAST(), b.toAST());
            },
            EqExpr: function (a, _, b) {
                return new BinaryOp('eq', a.toAST(), b.toAST());
            },
            NeqExpr: function (a, _, b) {
                return new BinaryOp('neq', a.toAST(), b.toAST());
            },
            DefVar: function (_, ident) {
                return ident.toAST();
            },
            AssignExpr: function (a, _, b) {
                return new MO.MAssignment(a.toAST(), b.toAST());
            },

            Block: function (_, body, _1) {
                return new MO.MBlock(body.toAST());
            },

            FunCall: function (a, _1, b, _2) {
                return new MO.MFunctionCall(a.toAST(), b.toAST());
            },
            Arguments: function (a) {
                return a.asIteration().toAST();
            },
            Parameters: function (a) {
                return a.asIteration().toAST();
            },
            IfExpr: function (_, a, tb, _1, eb) {
                var cond = a.toAST();
                var thenBody = tb.toAST();
                var elseBody = eb ? eb.toAST()[0] : null;
                return new MO.MIfCond(cond, thenBody, elseBody);
            },
            DefFun: function (_1, ident, _2, args, _3, block) {
                return new MO.MFunctionDef(ident.toAST(), args.toAST(), block.toAST());
            }
        });
    }
}
