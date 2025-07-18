/** @import { Token } from './token.js'; */

export class RuntimeError extends Error {
  /**
   * @param {Token} token
   * @param {string} message
   */
  constructor(token, message) {
    super(message);
    this.token = token;
  }
}
