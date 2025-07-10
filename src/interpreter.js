/**
 * @import { Binary, Expr, ExprVisitor, Grouping, Literal, Ternary, Unary } from "./expression.js";
 * @import { Reporter } from "./reporter.js";
 * @import { Token } from "./token.js";
 */

import { RuntimeError } from "./runtime-error.js";

/**
 * @implements {ExprVisitor<LoxValue>}
 */
export class Interpreter {
  /**
   * @param {Expr} expr
   * @param {Reporter} reporter
   */
  interpret(expr, reporter) {
    try {
      const value = this.#evaluate(expr);
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
   * Evaluates the expression and returns its value.
   * @param {Expr} expr
   * @returns {LoxValue}
   */
  #evaluate(expr) {
    return expr.accept(this);
  }

  /**
   * @param {Binary} expr
   * @returns {LoxValue}
   */
  visitBinary(expr) {
    const left = this.#evaluate(expr.left);
    const right = this.#evaluate(expr.right);

    switch (expr.operator.type) {
      case "LESS": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l < r;
      }
      case "LESS_EQUAL": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l <= r;
      }
      case "GREATER": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l > r;
      }
      case "GREATER_EQUAL": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l >= r;
      }
      case "BANG_EQUAL":
        return !isEqual(left, right);
      case "EQUAL_EQUAL":
        return isEqual(left, right);
      case "MINUS": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l - r;
      }
      case "PLUS":
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings.",
        );
      case "STAR": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l * r;
      }
      case "SLASH": {
        const [l, r] = checkNumberOperands(expr.operator, left, right);
        return l / r;
      }
    }

    // Unreachable
    throw new Error(`Unexpected binary operator: ${expr.operator.type}`);
  }

  /**
   * @param {Grouping} expr
   * @returns {LoxValue}
   */
  visitGrouping(expr) {
    return this.#evaluate(expr.expression);
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
    const right = this.#evaluate(expr.right);

    switch (expr.operator.type) {
      case "MINUS":
        checkNumberOperand(expr.operator, right);
        return -right;
      case "BANG":
        return !isTruthy(right);
    }

    // Unreachable
    throw new Error(`Unexpected unary operator: ${expr.operator.type}`);
  }

  /**
   * @param {Ternary} expr
   * @returns {LoxValue}
   */
  visitTernary(expr) {
    const condition = this.#evaluate(expr.cond);
    return this.#evaluate(isTruthy(condition) ? expr.trueExpr : expr.falseExpr);
  }
}

/**
 * Checks if the operand is a number. Throws a RuntimeError if not.
 * @param {Token} operator
 * @param {LoxValue} operand
 * @returns {asserts operand is number}
 */
function checkNumberOperand(operator, operand) {
  if (typeof operand !== "number") {
    throw new RuntimeError(operator, "Operand must be a number");
  }
}

/**
 * Checks if the operands are numbers. Throws a RuntimeError if not.
 * @param {Token} operator
 * @param {LoxValue} left
 * @param {LoxValue} right
 * @returns {[left: number, right: number]} Values of the left and right operands
 */
function checkNumberOperands(operator, left, right) {
  if (typeof left !== "number") {
    throw new RuntimeError(operator, "Left operand must be a number");
  }
  if (typeof right !== "number") {
    throw new RuntimeError(operator, "right operand must be a number");
  }
  return [left, right];
}

/**
 * Checks the truthiness of a Lox value. Everything except `false` and `nil` is
 * considered truthy.
 * @param {LoxValue} value
 * @returns {boolean}
 */
function isTruthy(value) {
  return !(value === false || value === null);
}

/**
 * Checks if two Lox values are equal. NaN is considered equal to itself.
 * @param {LoxValue} left
 * @param {LoxValue} right
 * @returns {boolean}
 */
function isEqual(left, right) {
  return left === right || (Number.isNaN(left) && Number.isNaN(right));
}

/**
 * @param {LoxValue} value
 * @returns {string}
 */
function stringify(value) {
  if (value === null) return "nil";
  return String(value);
}
