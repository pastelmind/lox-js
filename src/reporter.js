export class Reporter {
  /**
   * If true, the interpreter will not execute the current code, but only report
   * the errors.
   */
  #hadError = false;

  get hadError() {
    return this.#hadError;
  }

  /**
   * @param {number} line
   * @param {string} message
   */
  error(line, message) {
    this.report(line, "", message);
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
