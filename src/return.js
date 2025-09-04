/** @import { LoxValue } from "./value.js"; */

/**
 * Helper exception class that represents the return value of a function.
 */
export class ReturnValue extends Error {
  /**
   * @param {LoxValue} value
   */
  constructor(value) {
    super();
    /** @readonly */
    this.value = value;
  }
}
