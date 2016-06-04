/**
 * Created by josh on 6/4/16.
 */
var MO = require('./objects');

function binop(op,a,b) {  return new MO.BinaryOp(op, a.toAST(), b.toAST()); }

var operation = {
    int:   function (a)          { return new MO.MNumber(parseInt(this.interval.contents, 10)); },
    float: function (a, _, b)    { return new MO.MNumber(parseFloat(this.interval.contents, 10));  },
    str:   function (a, text, b) { return new MO.MString(text.interval.contents); },
    ident: function (a, b)       { return new MO.MSymbol(this.interval.contents, null) },

    AddExpr: (a, _, b) => binop('add',a,b),
    MulExpr: (a, _, b) => binop('mul',a,b),
    LtExpr:  (a, _, b) => binop('lt', a,b),
    GtExpr:  (a, _, b) => binop('gt', a,b),
    LteExpr: (a, _, b) => binop('lte',a,b),
    GteExpr: (a, _, b) => binop('gte',a,b),
    EqExpr:  (a, _, b) => binop('eq', a,b),
    NeqExpr: (a, _, b) => binop('neq',a,b),

    DefVar:     (_, ident) => ident.toAST(),
    AssignExpr: (a, _, b)  => new MO.MAssignment(a.toAST(), b.toAST()),

    Block: (_, body, _1) => new MO.MBlock(body.toAST()),
    IfExpr: function (_, cond, tb, _1, eb) {
        var thenBody = tb.toAST();
        var elseBody = eb ? eb.toAST()[0] : null;
        return new MO.MIfCond(cond.toAST(), thenBody, elseBody);
    },

    FunCall: (a,_1,b,_2) => new MO.MFunctionCall(a.toAST(), b.toAST()),
    Arguments: (a) => a.asIteration().toAST(),
    Parameters: (a) => a.asIteration().toAST(),
    DefFun: (_1, ident, _2, args, _3, block) => new MO.MFunctionDef(ident.toAST(), args.toAST(), block.toAST())
};
module.exports = {
    load: function (gram) {
        return gram.semantics().addOperation('toAST', operation);
    }
};
