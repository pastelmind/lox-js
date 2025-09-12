/**
 * @import { Expr, ExprVisitor } from "./expression.js";
 * @import { Interpreter } from "./interpreter.js";
 * @import { Block, Stmt, StmtVisitor, Var } from "./statement.js";
import { Token } from "./token.js";
 */

/**
 * Resolves variable declarations and usages and informs the interpreter.
 * This must be instantiated and invoked before running the interpreter.
 * @implements {ExprVisitor<void>}
 * @implements {StmtVisitor<void>}
 */
export class Resolver {
  /** @readonly */
  #interpreter;
  /**
   * Stack of local scopes.
   * Each scope maps variable names to a boolean; if the variable has been
   * declared but not defined yet, it is `false`. If the variable been defined,
   * it is `true`.
   * @readonly
   * @type {Map<string, boolean>[]}
   */
  #scope = [];

  /**
   * @param {Interpreter} interpreter
   */
  constructor(interpreter) {
    this.#interpreter = interpreter;
  }

  // Statement visitors

  /**
   * @param {Block} stmt
   */
  visitBlock(stmt) {
    this.#beginScope();
    this.#resolve(...stmt.statements);
    this.#endScope();
  }

  /**
   * @param {Var} stmt
   */
  visitVar(stmt) {
    this.#declare(stmt.name);
    if (stmt.initializer) {
      this.#resolve(stmt.initializer);
    }
    this.#define(stmt.name);
  }

  /**
   * Processes the given expressions and/or statements.
   * @param {...(Expr | Stmt)} args
   */
  #resolve(...args) {
    for (const arg of args) {
      arg.accept(this);
    }
  }

  /**
   * Starts a new scope.
   */
  #beginScope() {
    this.#scope.push(new Map());
  }

  /**
   * Ends the current scope.
   */
  #endScope() {
    if (!this.#scope.pop()) {
      throw new Error("Scope stack is empty.");
    }
  }

  /**
   * Declares a new variable in the current scope.
   * @param {Token} name
   */
  #declare(name) {
    const scope = this.#scope.at(-1);
    if (!scope) {
      throw new Error("Scope stack is empty.");
    }

    const prevSize = scope.size;
    scope.set(name.lexeme, false);
    if (scope.size === prevSize) {
      throw new Error(
        `Variable '${name.lexeme}' already declared in this scope.`,
      );
    }
  }
}
