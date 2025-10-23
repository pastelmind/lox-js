/**
 * @import { LoxClass } from "./class.js";
 * @import { Token } from "./token.js";
 * @import { LoxValue } from "./value.js";
 */

import { RuntimeError } from "./runtime-error.js";

export class LoxInstance {
  /** @readonly */
  #klass;
  /**
   * @type {Map<string, LoxValue>}
   * @readonly
   */
  #fields = new Map();

  /**
   *
   * @param {LoxClass} klass
   */
  constructor(klass) {
    this.#klass = klass;
  }

  /**
   * Returns the value of a property on the instance.
   * @param {Token} name Property name
   * @returns {LoxValue}
   * @throws {RuntimeError} If the property does not exist
   */
  get(name) {
    // Look up fields before methods.
    // (This allows fields to shadow methods with the same name.)
    const value = this.#fields.get(name.lexeme);
    if (value !== undefined) {
      return value;
    }

    const method = this.#klass.findMethod(name.lexeme);
    if (method) {
      return method.bindTo(this);
    }

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  /**
   * Sets the property on the instance to the given value.
   * @param {Token} name Property name
   * @param {LoxValue} value
   */
  set(name, value) {
    this.#fields.set(name.lexeme, value);
  }

  toString() {
    return `${this.#klass.name} instance`;
  }
}
