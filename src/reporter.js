/**
 * @import { RuntimeError } from "./runtime-error.js"
 * @import { Token } from "./token.js"
 */

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
   * @param {number | Token} lineOrToken
   * @param {string} message
   */
  error(lineOrToken, message) {
    if (typeof lineOrToken === "number") {
      this.report(lineOrToken, "", message);
    } else if (lineOrToken.type === "EOF") {
      this.report(lineOrToken.line, " at end", message);
    } else {
      this.report(lineOrToken.line, ` at '${lineOrToken.lexeme}'`, message);
    }
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

  /**
   * @param {RuntimeError} error
   */
  runtimeError(error) {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    this.#hadRuntimeError = true;
  }
}
