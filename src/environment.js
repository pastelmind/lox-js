import { RuntimeError } from "./runtime-error.js";

/**
 * @import { Token } from './token.js';
 * @import { LoxValue } from "./value.js";
 */

/** Placeholder value for unitialized variables. */
const UNINITIALIZED = Symbol("UNINITIALIZED");

export class Environment {
  /**
   * @readonly
   * @type {Map<string, LoxValue | typeof UNINITIALIZED>}
   */
  #values = new Map();
  /**
   * Enclosing environment, or `undefined` if this is the top (global)
   * environment.
   * @readonly
   */
  #enclosing;

  /**
   * @param {Environment=} enclosing Enclosing environment, or `undefined` if
   *    this is the top (global) environment.
   */
  constructor(enclosing) {
    this.#enclosing = enclosing;
  }

  /**
   * Defines a new variable or redefines an existing variable.
   * @param {string} name
   * @param {LoxValue=} value
   */
  define(name, value) {
    // We do not check if the variable name already exists.
    // This allows users to redefine existing variables, which makes coding in
    // the REPL easier.
    this.#values.set(name, value === undefined ? UNINITIALIZED : value);
  }

  /**
   * Returns a variable's value.
   * @param {Token} name
   * @returns {LoxValue}
   * @throws {RuntimeError} If the variable is not defined
   */
  get(name) {
    const value = this.#values.get(name.lexeme);

    if (value === UNINITIALIZED) {
      throw new RuntimeError(
        name,
        `Variable '${name.lexeme}' is not initialized.`,
      );
    }

    if (value !== undefined) {
      return value;
    }

    if (this.#enclosing) {
      return this.#enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Assigns a value to an existing variable.
   * @param {Token} name
   * @param {LoxValue} value
   * @throws {RuntimeError} If the variable is not defined
   */
  assign(name, value) {
    if (this.#values.has(name.lexeme)) {
      this.#values.set(name.lexeme, value);
    } else if (this.#enclosing) {
      this.#enclosing.assign(name, value);
    } else {
      throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }
  }
}
