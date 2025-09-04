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
   * @param {Interpreter} interpreter
   * @param {readonly LoxValue[]} args
   * @returns {LoxValue}
   */
  call(interpreter, args) {
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
