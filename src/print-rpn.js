import { Binary, Grouping, Literal, Ternary, Unary } from "./expression.js";
import { Token } from "./token.js";

/**
 * @import {
 *   Assign,
 *   Call,
 *   Expr,
 *   ExprVisitor,
 *   Logical,
 *   Variable,
 * } from './expression.js'
 */

/**
 * @implements {ExprVisitor<void>}
 */
class RpnPrinter {
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
    return `(${expr.name.lexeme} ${this.print(expr.value)} set)`;
  }

  /**
   * @param {Binary} expr
   * @returns {string}
   */
  visitBinary(expr) {
    return `${this.print(expr.left)} ${this.print(expr.right)} ${expr.operator.lexeme}`;
  }

  /**
   * @param {Call} expr
   * @returns {string}
   */
  visitCall(expr) {
    return `(${this.print(expr.callee)}${expr.args.map((arg) => ` ${this.print(arg)}`).join("")} call)`;
  }

  /**
   * @param {Grouping} expr
   * @returns {string}
   */
  visitGrouping(expr) {
    return this.print(expr.expression);
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
    return `${this.print(expr.left)} ${this.print(expr.right)} ${expr.operator.lexeme}`;
  }

  /**
   * @param {Unary} expr
   * @returns {string}
   */
  visitUnary(expr) {
    return `${this.print(expr.right)} ${expr.operator.lexeme}`;
  }

  /**
   * @param {Ternary} expr
   * @returns {string}
   */
  visitTernary(expr) {
    return `(? ${this.print(expr.cond)} ${this.print(expr.trueExpr)} ${this.print(expr.falseExpr)})`;
  }

  /**
   * @param {Variable} expr
   * @returns {string}
   */
  visitVariable(expr) {
    return `(${expr.name.lexeme} var)`;
  }
}

const expression1 = new Binary(
  new Unary(new Token("MINUS", "-", null, 1), new Literal(123)),
  new Token("STAR", "*", null, 1),
  new Grouping(new Literal(45.67)),
);

const expression2 = new Binary(
  new Grouping(
    new Binary(new Literal(1), new Token("PLUS", "+", null, 1), new Literal(2)),
  ),
  new Token("STAR", "*", null, 1),
  new Grouping(
    new Binary(
      new Literal(4),
      new Token("MINUS", "-", null, 1),
      new Literal(3),
    ),
  ),
);

const expression3 = new Ternary(
  new Literal(true),
  new Literal("yes"),
  new Ternary(new Literal(false), new Literal("no"), new Literal("maybe")),
);

console.log(new RpnPrinter().print(expression1));
console.log(new RpnPrinter().print(expression2));
console.log(new RpnPrinter().print(expression3));
