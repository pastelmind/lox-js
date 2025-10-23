/**
 * @import { LoxFunction } from "./function.js";
 * @import { Interpreter } from "./interpreter.js";
 * @import { LoxValue } from "./value.js";
 */

import { Callable } from "./callable.js";
import { LoxInstance } from "./instance.js";

/**
 * Represents the runtime value of a Lox class.
 */
export class LoxClass extends Callable {
  /**
   * @type {ReadonlyMap<string, LoxFunction>}
   * @readonly
   */
  #methods;

  /**
   * @param {string} name
   * @param {ReadonlyMap<string, LoxFunction>} methods
   */
  constructor(name, methods) {
    super();
    /** @readonly */
    this.name = name;
    this.#methods = methods;
  }

  /**
   * Looks up a class method by name. Returns `undefined` if it does not exist.
   * @param {string} name
   * @returns {LoxFunction | undefined}
   */
  findMethod(name) {
    return this.#methods.get(name);
  }

  toString() {
    return this.name;
  }

  /**
   * @override
   * @param {Interpreter} interpreter
   * @param {readonly LoxValue[]} args
   * @returns {LoxInstance}
   */
  call(interpreter, args) {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (initializer) {
      initializer.bindTo(instance).call(interpreter, args);
    }

    return instance;
  }

  /**
   * @override
   * @returns {number}
   */
  arity() {
    const initializer = this.findMethod("init");
    if (initializer) {
      return initializer.arity();
    }
    return 0;
  }
}
