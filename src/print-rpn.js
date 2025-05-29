import { Binary, Grouping, Literal, Unary } from "./expression.js";
import { Token } from "./token.js";

/**
 * @import { Expr, ExprVisitor } from './expression.js'
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
   * @param {Binary} expr
   * @returns {string}
   */
  visitBinary(expr) {
    return `${this.print(expr.left)} ${this.print(expr.right)} ${expr.operator.lexeme}`;
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
    return expr.value === null ? "nil" : String(expr.value);
  }

  /**
   * @param {Unary} expr
   * @returns {string}
   */
  visitUnary(expr) {
    return `${this.print(expr.right)} ${expr.operator.lexeme}`;
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

console.log(new RpnPrinter().print(expression1));
console.log(new RpnPrinter().print(expression2));
