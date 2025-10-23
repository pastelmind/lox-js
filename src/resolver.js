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
 * } from "./expression.js";
 * @import { Interpreter, ResolvableExpr } from "./interpreter.js";
 * @import { Reporter } from "./reporter.js";
 * @import {
 *   Block,
 *   Class,
 *   Expression,
 *   FunctionDecl,
 *   If,
 *   Print,
 *   Return,
 *   Stmt,
 *   StmtVisitor,
 *   Var,
 *   While,
 * } from "./statement.js";
 * @import { Token } from "./token.js";
 */

/** @typedef {'none' | 'class'} ClassType */
/** @typedef {'none' | 'function' | 'initializer' | 'method'} FunctionType */

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
   * Tracks whether the resolver is processing code inside a class body.
   * @type {ClassType}
   */
  #currentClass = "none";

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
   * @param {Class} stmt
   */
  visitClass(stmt) {
    const enclosingClass = this.#currentClass;
    this.#currentClass = "class";

    this.#declare(stmt.name);
    this.#define(stmt.name);

    const variablesInScope = this.#beginScope();
    variablesInScope.set("this", true);

    for (const method of stmt.methods) {
      const declaration =
        method.name.lexeme === "init" ? "initializer" : "method";
      this.#resolveFunction(method, declaration);
    }

    this.#endScope();
    this.#currentClass = enclosingClass;
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
      if (this.#currentFunction === "initializer") {
        this.#reporter.error(
          stmt.keyword,
          "Can't return a value from an initializer.",
        );
      }

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
   * @param {GetExpr} expr
   */
  visitGetExpr(expr) {
    this.resolve(expr.object);
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
   * @param {SetExpr} expr
   */
  visitSetExpr(expr) {
    this.resolve(expr.value, expr.object);
  }

  /**
   * @param {Ternary} expr
   */
  visitTernary(expr) {
    this.resolve(expr.cond, expr.trueExpr, expr.falseExpr);
  }

  /**
   * @param {This} expr
   */
  visitThis(expr) {
    if (this.#currentClass === "none") {
      this.#reporter.error(expr.keyword, "Can't use 'this' outside of class.");
      return;
    }

    this.#resolveLocal(expr, expr.keyword);
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
   * @returns {Map<string, boolean>} Map of variables in the new scope.
   */
  #beginScope() {
    const variablesInScope = new Map();
    this.#scopes.push(variablesInScope);
    return variablesInScope;
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
   * @param {ResolvableExpr} expr
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
