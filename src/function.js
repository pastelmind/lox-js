import { Callable } from "./callable.js";
import { Environment } from "./environment.js";
import { ReturnValue } from "./return.js";

/**
 * @import { Interpreter } from "./interpreter.js";
 * @import { FunctionDecl } from "./statement.js";
 * @import { LoxValue } from "./value.js";
 */

export class LoxFunction extends Callable {
  /** @readonly */
  #declaration;
  /** @readonly */
  #closure;

  /**
   * @param {FunctionDecl} declaration
   * @param {Environment} closure
   */
  constructor(declaration, closure) {
    super();
    this.#closure = closure;
    this.#declaration = declaration;
  }

  /**
   * @override
   * @param {Interpreter} interpreter
   * @param {readonly LoxValue[]} args
   * @returns {LoxValue}
   */
  call(interpreter, args) {
    const environment = new Environment(this.#closure);
    // Note: The interpreter ensures that the number of arguments matches the
    // number of parameters before calling this code.
    for (let i = 0; i < this.#declaration.params.length; i++) {
      environment.define(this.#declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.#declaration.body, environment);
    } catch (error) {
      if (error instanceof ReturnValue) {
        return error.value;
      }
      throw error;
    }

    return null;
  }

  /**
   * @override
   * @returns {number}
   */
  arity() {
    return this.#declaration.params.length;
  }

  toString() {
    return `<fn ${this.#declaration.name.lexeme}>`;
  }
}
