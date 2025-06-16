/**
 * @import {
 *   Binary,
 *   Expr,
 *   ExprVisitor,
 *   Grouping,
 *   Literal,
 *   Ternary,
 *   Unary,
 * } from './expression.js'
 */

/**
 * @implements {ExprVisitor<void>}
 */
export class AstPrinter {
  /**
   * @param {Expr} expr
   * @returns {string}
   */
  print(expr) {
    return expr.accept(this);
  }

  /**
   * @param {Binary} expr
   * @returns {string}
   */
  visitBinary(expr) {
    return `(${expr.operator.lexeme} ${this.print(expr.left)} ${this.print(expr.right)})`;
  }

  /**
   * @param {Grouping} expr
   * @returns {string}
   */
  visitGrouping(expr) {
    return `(group ${this.print(expr.expression)})`;
  }

  /**
   * @param {Literal} expr
   * @returns {string}
   */
  visitLiteral(expr) {
    return expr.value === null ? "nil" : String(expr.value);
  }

  /**
   * @param {Unary} expr
   * @returns {string}
   */
  visitUnary(expr) {
    return `(${expr.operator.lexeme} ${this.print(expr.right)})`;
  }

  /**
   * @param {Ternary} expr
   * @returns {string}
   */
  visitTernary(expr) {
    return `(${this.print(expr.cond)} ? ${this.print(expr.trueExpr)} : ${this.print(expr.falseExpr)})`;
  }
}
