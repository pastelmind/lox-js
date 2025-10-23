/**
 * @import {
 *   Assign,
 *   Binary,
 *   Call,
 *   Expr,
 *   ExprVisitor,
 *   GetExpr,
 *   Grouping,
 *   Literal,
 *   Logical,
 *   SetExpr,
 *   Ternary,
 *   This,
 *   Unary,
 *   Variable,
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
   * @param {Assign} expr
   * @returns {string}
   */
  visitAssign(expr) {
    return `(set ${expr.name} ${this.print(expr.value)})`;
  }

  /**
   * @param {Binary} expr
   * @returns {string}
   */
  visitBinary(expr) {
    return `(${expr.operator.lexeme} ${this.print(expr.left)} ${this.print(expr.right)})`;
  }

  /**
   * @param {Call} expr
   * @returns {string}
   */
  visitCall(expr) {
    return `(call ${this.print(expr.callee)}${expr.args.map((arg) => ` ${this.print(arg)}`).join("")})`;
  }

  /**
   * @param {GetExpr} expr
   * @returns {string}
   */
  visitGetExpr(expr) {
    return `(get ${this.print(expr.object)}.${expr.name.lexeme})`;
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
    return expr.value === null
      ? "nil"
      : typeof expr.value === "string"
        ? `"${expr.value}"`
        : String(expr.value);
  }

  /**
   * @param {Logical} expr
   * @returns {string}
   */
  visitLogical(expr) {
    return `(${expr.operator.lexeme} ${this.print(expr.left)} ${this.print(expr.right)})`;
  }

  /**
   * @param {SetExpr} expr
   * @returns {string}
   */
  visitSetExpr(expr) {
    return `(set ${this.print(expr.object)}.${expr.name.lexeme} ${this.print(expr.value)})`;
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

  /**
   * @param {This} expr
   * @returns {string}
   */
  visitThis(expr) {
    return expr.keyword.lexeme;
  }

  /**
   * @param {Variable} expr
   * @returns {string}
   */
  visitVariable(expr) {
    return `(var ${expr.name.lexeme})`;
  }
}
