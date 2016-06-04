/**
 * Created by josh on 6/4/16.
 */
var MO = require('./objects');
var MString = MO.MString;
var BinaryOp = MO.BinaryOp;

function binop(op,a,b) {
    return new BinaryOp(op, a.toAST(), b.toAST());
}
var operation = {
    int:   function (a)          { return new MO.MNumber(parseInt(this.interval.contents, 10)); },
    float: function (a, _, b)    { return new MO.MNumber(parseFloat(this.interval.contents, 10));  },
    str:   function (a, text, b) { return new MString(text.interval.contents); },
    ident: function (a, b)       { return new MO.MSymbol(this.interval.contents, null); },

    AddExpr: (a, _, b) => binop('add',a,b),
    MulExpr: (a, _, b) => binop('mul',a,b),
    LtExpr:  (a, _, b) => binop('lt',a,b),
    GtExpr:  (a, _, b) => binop('gt',a,b),
    LteExpr: (a, _, b) => binop('lte',a,b),
    GteExpr: (a, _, b) => binop('gte',a,b),
    EqExpr:  (a, _, b) => binop('eq',a,b),
    NeqExpr: (a, _, b) => binop('neq',a,b),

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
};
module.exports = {
    load: function (gram) {
        return gram.semantics().addOperation('toAST', operation);
    }
};
