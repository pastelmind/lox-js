/** @import { Token } from './token.js' */

/**
 * @template R Value returned by the visitor methods.
 * @typedef {object} ExprVisitor
 * @property {(expr: Assign) => R} visitAssign
 * @property {(expr: Binary) => R} visitBinary
 * @property {(expr: Grouping) => R} visitGrouping
 * @property {(expr: Literal) => R} visitLiteral
 * @property {(expr: Logical) => R} visitLogical
 * @property {(expr: Unary) => R} visitUnary
 * @property {(expr: Ternary) => R} visitTernary
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
