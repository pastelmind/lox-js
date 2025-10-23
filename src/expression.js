/**
 * @import { Token } from './token.js';
 * @import { LoxValue } from "./value.js";
 */

/**
 * @template R Value returned by the visitor methods.
 * @typedef {object} ExprVisitor
 * @property {(expr: Assign) => R} visitAssign
 * @property {(expr: Binary) => R} visitBinary
 * @property {(expr: Call) => R} visitCall
 * @property {(expr: GetExpr) => R} visitGetExpr
 * @property {(expr: Grouping) => R} visitGrouping
 * @property {(expr: Literal) => R} visitLiteral
 * @property {(expr: Logical) => R} visitLogical
 * @property {(expr: SetExpr) => R} visitSetExpr
 * @property {(expr: Unary) => R} visitUnary
 * @property {(expr: Ternary) => R} visitTernary
 * @property {(expr: This) => R} visitThis
 * @property {(expr: Variable) => R} visitVariable
 */

/**
 * AST node for Lox expressions.
 * @abstract
 */
export class Expr {
  /**
   * @template R
   * @param {ExprVisitor<R>} _visitor
   * @returns {R}
   */
  accept(_visitor) {
    throw new Error("Not implemented");
  }
}

/**
 * AST node for the assignment expression.
 */
export class Assign extends Expr {
  /**
   * @param {Token} name
   * @param {Expr} value
   */
  constructor(name, value) {
    super();
    /** @readonly */
    this.name = name;
    /** @readonly */
    this.value = value;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitAssign(this);
  }
}

export class Binary extends Expr {
  /**
   * @param {Expr} left
   * @param {Token} operator
   * @param {Expr} right
   */
  constructor(left, operator, right) {
    super();
    /** @readonly */
    this.left = left;
    /** @readonly */
    this.operator = operator;
    /** @readonly */
    this.right = right;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitBinary(this);
  }
}

/**
 * AST node for the function call expression.
 */
export class Call extends Expr {
  /**
   * @param {Expr} callee
   * @param {Token} paren
   * @param {readonly Expr[]} args
   */
  constructor(callee, paren, args) {
    super();
    /** @readonly */
    this.callee = callee;
    /** @readonly */
    this.paren = paren;
    /** @readonly */
    this.args = args;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitCall(this);
  }
}

/**
 * AST node for the property access expression (AKA "get expression").
 */
export class GetExpr extends Expr {
  /**
   * @param {Expr} object Expression that evaluates to a Lox object
   * @param {Token} name Property name to access
   */
  constructor(object, name) {
    super();
    /**
     * Expression that evaluates to a Lox object
     * @readonly
     */
    this.object = object;
    /**
     * Property name to access
     * @readonly
     */
    this.name = name;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitGetExpr(this);
  }
}

export class Grouping extends Expr {
  /**
   * @param {Expr} expression
   */
  constructor(expression) {
    super();
    /** @readonly */
    this.expression = expression;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitGrouping(this);
  }
}

export class Literal extends Expr {
  /**
   * @param {LoxValue} value
   */
  constructor(value) {
    super();
    /** @readonly */
    this.value = value;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitLiteral(this);
  }
}

export class Logical extends Expr {
  /**
   * @param {Expr} left
   * @param {Token} operator
   * @param {Expr} right
   */
  constructor(left, operator, right) {
    super();
    /** @readonly */
    this.left = left;
    /** @readonly */
    this.operator = operator;
    /** @readonly */
    this.right = right;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitLogical(this);
  }
}

/**
 * AST node for the property assignment expression (AKA "set expression").
 */
export class SetExpr extends Expr {
  /**
   * @param {Expr} object Expression that evaluates to a Lox object
   * @param {Token} name Property name to assign to
   * @param {Expr} value Expression that evaluates to the value to assign
   */
  constructor(object, name, value) {
    super();
    /**
     * Expression that evaluates to a Lox object
     * @readonly
     */
    this.object = object;
    /**
     * Property name to assign to
     * @readonly
     */
    this.name = name;
    /**
     * Expression that evaluates to the value to assign
     * @readonly
     */
    this.value = value;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitSetExpr(this);
  }
}

export class Unary extends Expr {
  /**
   * @param {Token} operator
   * @param {Expr} right
   */
  constructor(operator, right) {
    super();
    /** @readonly */
    this.operator = operator;
    /** @readonly */
    this.right = right;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitUnary(this);
  }
}

export class Ternary extends Expr {
  /**
   * @param {Expr} cond
   * @param {Expr} trueExpr
   * @param {Expr} falseExpr
   */
  constructor(cond, trueExpr, falseExpr) {
    super();
    /** @readonly */
    this.cond = cond;
    /** @readonly */
    this.trueExpr = trueExpr;
    this.falseExpr = falseExpr;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitTernary(this);
  }
}

/**
 * AST node for the this-expression.
 */
export class This extends Expr {
  /**
   * @param {Token} keyword
   */
  constructor(keyword) {
    super();
    /** @readonly */
    this.keyword = keyword;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitThis(this);
  }
}

/**
 * AST node for the variable access expression.
 */
export class Variable extends Expr {
  /**
   * @param {Token} name
   */
  constructor(name) {
    super();
    /** @readonly */
    this.name = name;
  }

  /**
   * @override
   * @template R
   * @param {ExprVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitVariable(this);
  }
}
