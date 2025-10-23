/** @import { LoxInstance } from "./instance.js"; */

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
  /** @readonly */
  #isInitializer;

  /**
   * @param {FunctionDecl} declaration
   * @param {Environment} closure
   * @param {boolean} isInitializer
   */
  constructor(declaration, closure, isInitializer) {
    super();
    this.#closure = closure;
    this.#declaration = declaration;
    this.#isInitializer = isInitializer;
  }

  /**
   * Creates a new {@linkcode LoxFunction} based on the current one, but with
   * the `this` keyword bound to the given {@linkcode LoxInstance}.
   * @param {LoxInstance} instance
   * @returns {LoxFunction}
   */
  bindTo(instance) {
    const environment = new Environment(this.#closure);
    environment.define("this", instance);
    return new LoxFunction(this.#declaration, environment, this.#isInitializer);
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
        if (this.#isInitializer) {
          // Edge case: When the initializer is directly called on a LoxInstance
          // and the initializer body contains a return-statement, always return
          // `this` (i.e. the LoxInstance).
          return this.#closure.getAt(0, "this");
        }
        return error.value;
      }
      throw error;
    }

    if (this.#isInitializer) {
      // Edge case: When the initializer is directly called on a LoxInstance,
      // and exits without encountering a return-statement, always return `this`
      // (i.e. the LoxInstance).
      return this.#closure.getAt(0, "this");
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
