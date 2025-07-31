/**
 * @import { Expr } from './expression.js'
 * @import { Token } from './token.js';
 */

/**
 * @template R Value returned by the visitor methods.
 * @typedef {object} StmtVisitor
 * @property {(expr: Block) => R} visitBlock Visits the block statement
 * @property {(expr: Expression) => R} visitExpression Visits the expression statement
 * @property {(expr: Print) => R} visitPrint Visits the print statement
 * @property {(expr: Var) => R} visitVar Visits the variable declaration statement
 */

/**
 * AST node for Lox statements.
 * @abstract
 */
export class Stmt {
  /**
   * @template R
   * @param {StmtVisitor<R>} _visitor
   * @returns {R}
   */
  accept(_visitor) {
    throw new Error("Not implemented");
  }
}

/**
 * AST node for the block statement.
 */
export class Block extends Stmt {
  /**
   * @param {readonly Stmt[]} statements
   */
  constructor(statements) {
    super();
    /** @readonly */
    this.statements = statements;
  }

  /**
   * @override
   * @template R
   * @param {StmtVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitBlock(this);
  }
}

/**
 * AST node for the expression statement.
 */
export class Expression extends Stmt {
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
   * @param {StmtVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitExpression(this);
  }
}

/**
 * AST node for the print statement.
 */
export class Print extends Stmt {
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
   * @param {StmtVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitPrint(this);
  }
}

/**
 * AST node for the variable declaration.
 */
export class Var extends Stmt {
  /**
   * @param {Token} name
   * @param {Expr=} initializer
   */
  constructor(name, initializer) {
    super();
    /** @readonly */
    this.name = name;
    /** @readonly */
    this.initializer = initializer;
  }

  /**
   * @override
   * @template R
   * @param {StmtVisitor<R>} visitor
   * @returns {R}
   */
  accept(visitor) {
    return visitor.visitVar(this);
  }
}
