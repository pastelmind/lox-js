/**
 * @import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Ternary, Unary, Variable } from "./expression.js";
 * @import { Reporter } from "./reporter.js";
 * @import { Block, Expression, FunctionDecl, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./statement.js";
 * @import { Token } from "./token.js";
 * @import { LoxValue } from "./value.js";
 */

import { Callable } from "./callable.js";
import { ClockFunction } from "./clock.js";
import { Environment } from "./environment.js";
import { LoxFunction } from "./function.js";
import { ReturnValue } from "./return.js";
import { RuntimeError } from "./runtime-error.js";

/**
 * @implements {StmtVisitor<void>}
 * @implements {ExprVisitor<LoxValue>}
 */
export class Interpreter {
  /** @readonly */
  #globals = new Environment();
  #environment = this.#globals;

  constructor() {
    this.#globals.define("clock", new ClockFunction());
  }

  /**
   * Interprets a sequence of statements.
   * @param {Iterable<Stmt>} statements
   * @param {Reporter} reporter
   */
  interpret(statements, reporter) {
    try {
      for (const statement of statements) {
        this.#execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        reporter.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Evaluates a single expression and prints its value.
   * @param {Expr} expr
   * @param {Reporter} reporter
   */
  interpretExpression(expr, reporter) {
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
   * Executes a statement.
   * @param {Stmt} stmt
   */
  #execute(stmt) {
    stmt.accept(this);
  }

  /**
   * Executes the contents of a block statement.
   *
   * During execution, the interpreter's environment is replaced with the given
   * {@linkcode environment}, and is restored when the block is finished.
   * @param {Iterable<Stmt>} statements
   * @param {Environment} environment
   */
  executeBlock(statements, environment) {
    const previous = this.#environment;
    this.#environment = environment;
    try {
      for (const statement of statements) {
        this.#execute(statement);
      }
    } finally {
      this.#environment = previous;
    }
  }

  /**
   * @param {Block} stmt
   */
  visitBlock(stmt) {
    this.executeBlock(stmt.statements, new Environment(this.#environment));
  }

  /**
   * @param {Expression} stmt
   * @returns {void}
   */
  visitExpression(stmt) {
    this.#evaluate(stmt.expression);
  }

  /**
   * @param {FunctionDecl} stmt
   */
  visitFunctionDecl(stmt) {
    const fn = new LoxFunction(stmt, this.#environment);
    this.#environment.define(stmt.name.lexeme, fn);
    return null;
  }

  /**
   * @param {If} stmt
   * @returns {void}
   */
  visitIf(stmt) {
    const condition = this.#evaluate(stmt.condition);
    if (isTruthy(condition)) {
      this.#execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.#execute(stmt.elseBranch);
    }
  }

  /**
   * @param {Print} stmt
   * @returns {void}
   */
  visitPrint(stmt) {
    const value = this.#evaluate(stmt.expression);
    console.log(stringify(value));
  }

  /**
   * @param {Return} stmt
   * @returns {void}
   */
  visitReturn(stmt) {
    const value = stmt.value ? this.#evaluate(stmt.value) : null;
    throw new ReturnValue(value);
  }

  /**
   * @param {Var} stmt
   */
  visitVar(stmt) {
    // A variable without an initializer expression is marked as uninitialized.
    const value = stmt.initializer
      ? this.#evaluate(stmt.initializer)
      : undefined;
    this.#environment.define(stmt.name.lexeme, value);
  }

  /**
   * @param {While} stmt
   */
  visitWhile(stmt) {
    while (isTruthy(this.#evaluate(stmt.condition))) {
      this.#execute(stmt.body);
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
   * @param {Assign} expr
   * @returns {LoxValue}
   */
  visitAssign(expr) {
    const value = this.#evaluate(expr.value);
    this.#environment.assign(expr.name, value);
    return value;
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
      case "COMMA": {
        return right;
      }
    }

    // Unreachable
    throw new Error(`Unexpected binary operator: ${expr.operator.type}`);
  }

  /**
   * @param {Call} expr
   * @returns {LoxValue}
   */
  visitCall(expr) {
    const callee = this.#evaluate(expr.callee);

    const args = expr.args.map((expr) => this.#evaluate(expr));

    if (!(callee instanceof Callable)) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes.",
      );
    }

    if (args.length !== callee.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${callee.arity()} arguments but got ${args.length}.`,
      );
    }

    return callee.call(this, args);
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
   * @param {Logical} expr
   * @returns {LoxValue}
   */
  visitLogical(expr) {
    const left = this.#evaluate(expr.left);

    if (expr.operator.type === "OR") {
      return isTruthy(left) ? left : this.#evaluate(expr.right);
    }
    if (expr.operator.type === "AND") {
      return !isTruthy(left) ? left : this.#evaluate(expr.right);
    }

    // Unreachable
    throw new Error(`Unexpected logical operator: ${expr.operator.type}`);
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

  /**
   * @param {Variable} expr
   * @returns {LoxValue}
   */
  visitVariable(expr) {
    return this.#environment.get(expr.name);
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
