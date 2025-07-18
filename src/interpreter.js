/**
 * @import {
 *   Binary,
 *   Expr,
 *   ExprVisitor,
 *   Grouping,
 *   Literal,
 *   Ternary,
 *   Unary,
 * } from './expression.js';
 * @import { Token } from './token.js';
 * @import { LoxValue } from './value.js';
 */

import { Reporter } from "./reporter.js";
import { RuntimeError } from "./runtime-error.js";

/**
 * @param {LoxValue} value
 * @returns {boolean}
 */
function isTruthy(value) {
  return !(value === null || value === false);
}

/**
 * @param {Token} operator
 * @param {LoxValue} operand
 * @returns {asserts operand is number}
 */
function checkNumberOperand(operator, operand) {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "Operand must be a number.");
}

/**
 * @param {LoxValue} left
 * @param {LoxValue} right
 * @returns {boolean}
 */
function isEqual(left, right) {
  return left === right || (Number.isNaN(left) && Number.isNaN(right));
}

/**
 * @param {LoxValue} value
 */
function stringify(value) {
  if (value === null) return "nil";
  return String(value);
}

/**
 * @implements {ExprVisitor<LoxValue>}
 */
export class Interpreter {
  /**
   * @param {Expr} expression
   * @param {Reporter} reporter
   */
  interpret(expression, reporter) {
    try {
      const value = expression.accept(this);
      console.log(stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        reporter.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * @param {Binary} expr
   * @returns {LoxValue}
   */
  visitBinary(expr) {
    const left = expr.left.accept(this);
    const right = expr.right.accept(this);

    switch (expr.operator.type) {
      case "MINUS":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left - right;
      case "PLUS":
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator,
          "Operands must be numbers or strings.",
        );
      case "STAR":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left * right;
      case "SLASH":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left / right;
      case "GREATER":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left > right;
      case "GREATER_EQUAL":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left >= right;
      case "LESS":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left < right;
      case "LESS_EQUAL":
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left <= right;
      case "BANG_EQUAL":
        return !isEqual(left, right);
      case "EQUAL_EQUAL":
        return isEqual(left, right);
      default:
        throw new RuntimeError(expr.operator, "Unknown binary operator.");
    }
  }

  /**
   * @param {Grouping} expr
   * @returns {LoxValue}
   */
  visitGrouping(expr) {
    return expr.expression.accept(this);
  }

  /**
   * @param {Literal} expr
   * @returns {LoxValue}
   */
  visitLiteral(expr) {
    return expr.value;
  }

  /**
   * @param {Unary} expr
   * @returns {LoxValue}
   */
  visitUnary(expr) {
    const right = expr.right.accept(this);

    switch (expr.operator.type) {
      case "MINUS":
        checkNumberOperand(expr.operator, right);
        return -right;
      case "BANG":
        return !isTruthy(right);
      default:
        throw new RuntimeError(expr.operator, "Unknown unary operator.");
    }
  }

  /**
   * @param {Ternary} expr
   * @returns {LoxValue}
   */
  visitTernary(expr) {
    const cond = expr.cond.accept(this);

    return isTruthy(cond)
      ? expr.trueExpr.accept(this)
      : expr.falseExpr.accept(this);
  }
}
