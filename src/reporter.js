import { RuntimeError } from "./runtime-error.js";

export class Reporter {
  /**
   * If true, the interpreter will not execute the current code, but only report
   * the errors.
   */
  #hadError = false;
  #hadRuntimeError = false;

  get hadError() {
    return this.#hadError;
  }

  get hadRuntimeError() {
    return this.#hadRuntimeError;
  }

  /**
   * @param {number} line
   * @param {string} message
   */
  error(line, message) {
    this.report(line, "", message);
  }

  /**
   * @param {RuntimeError} error
   */
  runtimeError(error) {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    this.#hadRuntimeError = true;
  }

  /**
   * @param {number} line
   * @param {string} where
   * @param {string} message
   */
  report(line, where, message) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    this.#hadError = true;
  }
}
