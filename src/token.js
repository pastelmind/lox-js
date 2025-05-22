/** @import { TokenType } from './token-type.js' */

export class Token {
  /**
   * @param {TokenType} type
   * @param {string} lexeme
   * @param {number | string | null} literal
   * @param {number} line
   */
  constructor(type, lexeme, literal, line) {
    /** @readonly */
    this.type = type;
    /** @readonly */
    this.lexeme = lexeme;
    /** @readonly */
    this.literal = literal;
    /** @readonly */
    this.line = line;
  }

  toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
