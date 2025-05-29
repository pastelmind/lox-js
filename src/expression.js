/** @import { Token } from './token.js' */

/**
 * @template R Value returned by the visitor methods.
 * @typedef {object} ExprVisitor
 * @property {(expr: Binary) => R} visitBinary
 * @property {(expr: Grouping) => R} visitGrouping
 * @property {(expr: Literal) => R} visitLiteral
 * @property {(expr: Unary) => R} visitUnary
 */

/**
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
   * @param {number | string | null} value
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
