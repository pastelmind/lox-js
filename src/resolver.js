/**
 * @import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Ternary, Unary, Variable } from "./expression.js";
 * @import { Interpreter } from "./interpreter.js";
 * @import { Reporter } from "./reporter.js";
 * @import { Block, Expression, FunctionDecl, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./statement.js";
 * @import { Token } from "./token.js";
 */

/** @typedef {'none' | 'function'} FunctionType */

/**
 * Resolves variable declarations and usages and informs the interpreter.
 * This must be instantiated and invoked before running the interpreter.
 * @implements {ExprVisitor<void>}
 * @implements {StmtVisitor<void>}
 */
export class Resolver {
  /**
   * The associated interpreter instance.
   * When the resolver is given a program to process, it will feed the variable
   * resolution information to this interpreter.
   * @readonly
   */
  #interpreter;
  /** @readonly */
  #reporter;

  /**
   * Stack of Maps for local scopes.
   * For each local scope, the Map maps each variable name to a boolean value.
   * If the variable is declared but not defined yet, the value is `false`. If
   * the variable been defined, it is `true`.
   * @readonly
   * @type {Map<string, boolean>[]}
   */
  #scopes = [];

  /**
   * Tracks whether the resolver is processing code inside a function body.
   * @type {FunctionType}
   */
  #currentFunction = "none";

  /**
   * @param {Interpreter} interpreter
   * @param {Reporter} reporter
   */
  constructor(interpreter, reporter) {
    this.#interpreter = interpreter;
    this.#reporter = reporter;
  }

  // Statement visitors

  /**
   * @param {Block} stmt
   */
  visitBlock(stmt) {
    this.#beginScope();
    this.resolve(...stmt.statements);
    this.#endScope();
  }

  /**
   * @param {Expression} stmt
   */
  visitExpression(stmt) {
    this.resolve(stmt.expression);
  }

  /**
   * @param {FunctionDecl} stmt
   */
  visitFunctionDecl(stmt) {
    // A function is defined immediately when it is declared.
    this.#declare(stmt.name);
    this.#define(stmt.name);

    this.#resolveFunction(stmt, "function");
  }

  /**
   * @param {If} stmt
   */
  visitIf(stmt) {
    this.resolve(stmt.condition, stmt.thenBranch);
    if (stmt.elseBranch) {
      this.resolve(stmt.elseBranch);
    }
  }

  /**
   * @param {Print} stmt
   */
  visitPrint(stmt) {
    this.resolve(stmt.expression);
  }

  /**
   * @param {Return} stmt
   */
  visitReturn(stmt) {
    if (this.#currentFunction === "none") {
      this.#reporter.error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value) {
      this.resolve(stmt.value);
    }
  }

  /**
   * @param {Var} stmt
   */
  visitVar(stmt) {
    this.#declare(stmt.name);
    if (stmt.initializer) {
      this.resolve(stmt.initializer);
    }
    this.#define(stmt.name);
  }

  /**
   * @param {While} stmt
   */
  visitWhile(stmt) {
    this.resolve(stmt.condition, stmt.body);
  }

  /**
   * @param {Assign} expr
   */
  visitAssign(expr) {
    this.resolve(expr.value);
    this.#resolveLocal(expr, expr.name);
  }

  /**
   * @param {Binary} expr
   */
  visitBinary(expr) {
    this.resolve(expr.left, expr.right);
  }

  /**
   * @param {Call} expr
   */
  visitCall(expr) {
    this.resolve(expr.callee, ...expr.args);
  }

  /**
   * @param {Grouping} expr
   */
  visitGrouping(expr) {
    this.resolve(expr.expression);
  }

  /**
   * @param {Literal} _expr
   */
  visitLiteral(_expr) {
    // no op
  }

  /**
   * @param {Logical} expr
   */
  visitLogical(expr) {
    this.resolve(expr.left, expr.right);
  }

  /**
   * @param {Ternary} expr
   */
  visitTernary(expr) {
    this.resolve(expr.cond, expr.trueExpr, expr.falseExpr);
  }

  /**
   * @param {Unary} expr
   */
  visitUnary(expr) {
    this.resolve(expr.right);
  }

  /**
   * @param {Variable} expr
   */
  visitVariable(expr) {
    if (this.#scopes.at(-1)?.get(expr.name.lexeme) === false) {
      // The variable is declared but not defined yet
      this.#reporter.error(
        expr.name,
        "Can't read local variable in its own initializer.",
      );
      return;
    }

    this.#resolveLocal(expr, expr.name);
  }

  /**
   * Resolves variables in the given expressions and/or statements.
   * The resulting variable resolution information is fed to the interpreter.
   * @param {...(Expr | Stmt)} args
   */
  resolve(...args) {
    for (const arg of args) {
      arg.accept(this);
    }
  }

  /**
   * Resolves the body of a function declaration statement.
   * @param {FunctionDecl} stmt
   * @param {FunctionType} functionType
   */
  #resolveFunction(stmt, functionType) {
    const enclosingFunction = this.#currentFunction;
    this.#currentFunction = functionType;

    this.#beginScope();
    for (const param of stmt.params) {
      this.#declare(param);
      this.#define(param);
    }
    this.resolve(...stmt.body);
    this.#endScope();

    this.#currentFunction = enclosingFunction;
  }

  /**
   * Starts a new scope.
   */
  #beginScope() {
    this.#scopes.push(new Map());
  }

  /**
   * Ends the current scope.
   */
  #endScope() {
    if (!this.#scopes.pop()) {
      throw new Error("Scope stack is empty.");
    }
  }

  /**
   * Declares a new variable in the current scope.
   * The variable is not defined yet; accessing it is an error.
   * @param {Token} name
   */
  #declare(name) {
    const scope = this.#scopes.at(-1);
    if (!scope) {
      // If we are declaring a global variable, do nothing.
      return;
    }

    const prevSize = scope.size;
    scope.set(name.lexeme, false);
    if (scope.size === prevSize) {
      throw new Error(
        `Variable '${name.lexeme}' already declared in this scope.`,
      );
    }
  }

  /**
   * Marks a variable in the current scope as defined.
   * The variable must be declared first with `#declare()`.
   * @param {Token} name
   */
  #define(name) {
    const currentScope = this.#scopes.at(-1);
    if (!currentScope) {
      // If we are defining a global variable, do nothing.
      return;
    }

    switch (currentScope.get(name.lexeme)) {
      case undefined:
        throw new Error(`Variable '${name.lexeme}' not declared.`);
      case true:
        throw new Error(
          `Variable '${name.lexeme}' already defined in this scope.`,
        );
    }

    currentScope.set(name.lexeme, true);
  }

  /**
   * Resolves a variable {@linkcode name} in the expression {@linkcode expr} and
   * feeds the resolution information to the interpreter.
   * @param {Expr} expr
   * @param {Token} name
   */
  #resolveLocal(expr, name) {
    for (let i = this.#scopes.length - 1; i >= 0; i--) {
      const scope = this.#scopes[i];
      if (scope.has(name.lexeme)) {
        this.#interpreter.resolve(expr, this.#scopes.length - 1 - i);
        return;
      }
    }
  }
}
