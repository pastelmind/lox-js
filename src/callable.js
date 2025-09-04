/**
 * @import { Interpreter } from "./interpreter.js";
 * @import { LoxValue } from "./value.js";
 */

/**
 * Base class for all callable objects.
 * @abstract
 */
export class Callable {
  /**
   * Executes the callable.
   * @param {Interpreter} _interpreter
   * @param {readonly LoxValue[]} _args
   * @returns {LoxValue}
   */
  call(_interpreter, _args) {
    throw new Error("Not implemented");
  }

  /**
   * Returns the number of arguments the callable expects.
   * @returns {number}
   */
  arity() {
    throw new Error("Not implemented");
  }
}
