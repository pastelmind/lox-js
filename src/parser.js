/** @import { Expr } from './expression.js' */
/** @import { Reporter } from './reporter.js' */
/** @import { Token } from './token.js'; */
/** @import { TokenType } from './token-type.js' */

import { Binary, Grouping, Literal, Ternary, Unary } from "./expression.js";

export class Parser {
  /** @readonly */
  #tokens;
  #current = 0;

  /** @readonly */
  #reporter;

  /**
   * @param {readonly Token[]} tokens
   * @param {Reporter} reporter
   */
  constructor(tokens, reporter) {
    this.#tokens = tokens;
    this.#reporter = reporter;
  }

  /**
   * @returns {Expr | null}
   */
  parse() {
    try {
      return this.#expression();
    } catch (error) {
      if (error instanceof ParseError) {
        return null;
      }
      throw error;
    }
  }

  #isAtEnd() {
    return this.#current >= this.#tokens.length;
  }

  /**
   * @returns {Token}
   */
  #previous() {
    if (this.#current === 0) {
      throw new Error("No previous token available.");
    }
    const prev = this.#tokens[this.#current - 1];
    if (prev === undefined) {
      throw new Error("No previous token available.");
    }
    return prev;
  }

  /**
   * Gets the curren token.
   * @returns {Token}
   */
  #peek() {
    const token = this.#tokens.at(this.#current);
    if (!token) {
      throw new Error("No current token available.");
    }
    return token;
  }

  /**
   * Checks if the current token is of the given type.
   * Does not consume the token.
   * @param {TokenType} type
   */
  #check(type) {
    const current = this.#tokens.at(this.#current);
    if (current === undefined) {
      return false;
    }
    return current.type === type;
  }

  /**
   * Consumes and returns the current token.
   * If the end of the token stream is reached, returns the last token (EOF).
   * @returns {Token}
   */
  #advance() {
    if (!this.#isAtEnd()) {
      this.#current++;
    }
    return this.#previous();
  }

  /**
   * Checks if the current token is of the given type.
   * If so, consumes the token.
   * @param  {...TokenType} types
   * @returns {boolean}
   */
  #match(...types) {
    const current = this.#tokens.at(this.#current);
    if (current === undefined) {
      return false;
    }

    for (const type of types) {
      if (current.type === type) {
        this.#advance();
        return true;
      }
    }

    return false;
  }

  /**
   * If the current token is of the given type, consumes and returns it.
   * Otherwise, throws an error.
   * @param {TokenType} type
   * @param {string} message
   * @returns {Token}
   */
  #consume(type, message) {
    if (this.#check(type)) {
      return this.#advance();
    }

    throw this.#error(this.#peek(), message);
  }

  /**
   * Reports an error and returns a {@linkcode ParseError} object.
   * (Return instead of throwing, to allow the caller to decide whether to throw
   * or not.)
   * @param {Token} token
   * @param {string} message
   * @returns {ParseError}
   */
  #error(token, message) {
    this.#reportError(token, message);
    return new ParseError();
  }

  /**
   * @param {Token} token
   * @param {string} message
   */
  #reportError(token, message) {
    if (token.type === "EOF") {
      this.#reporter.report(token.line, " at end", message);
    } else {
      this.#reporter.report(token.line, ` at '${token.lexeme}'`, message);
    }
  }

  /**
   * @returns {Expr}
   */
  #expression() {
    return this.#comma();
  }

  /**
   * @returns {Expr}
   */
  #comma() {
    let expr = this.#ternary();

    while (this.#match("COMMA")) {
      const operator = this.#previous();
      const right = this.#ternary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #ternary() {
    let expr = this.#equality();
    let lastTernary = null;

    while (this.#match("QUESTION")) {
      const trueExpr = this.#equality();
      this.#consume("COLON", "Expected ':' after '?' in ternary expression.");
      const falseExpr = this.#equality();

      if (lastTernary) {
        /** @type {Ternary} */
        const nextTernary = new Ternary(
          lastTernary.falseExpr,
          trueExpr,
          falseExpr,
        );
        lastTernary.falseExpr = nextTernary;
        lastTernary = nextTernary;
      } else {
        lastTernary = expr = new Ternary(expr, trueExpr, falseExpr);
      }
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #equality() {
    let expr = this.#comparison();

    while (this.#match("EQUAL", "BANG_EQUAL")) {
      const operator = this.#previous();
      const right = this.#comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #comparison() {
    let expr = this.#term();

    while (this.#match("LESS", "LESS_EQUAL", "GREATER", "GREATER_EQUAL")) {
      const operator = this.#previous();
      const right = this.#term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #term() {
    let expr = this.#factor();

    while (this.#match("MINUS", "PLUS")) {
      const operator = this.#previous();
      const right = this.#factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #factor() {
    let expr = this.#unary();

    while (this.#match("SLASH", "STAR")) {
      const operator = this.#previous();
      const right = this.#unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #unary() {
    if (this.#match("BANG", "MINUS")) {
      const operator = this.#previous();
      const right = this.#unary();
      return new Unary(operator, right);
    }

    return this.#primary();
  }

  /**
   * @returns {Expr}
   */
  #primary() {
    if (this.#match("NUMBER", "STRING")) {
      return new Literal(this.#previous().literal);
    }

    if (this.#match("FALSE")) {
      return new Literal(false);
    }

    if (this.#match("TRUE")) {
      return new Literal(true);
    }

    if (this.#match("NIL")) {
      return new Literal(null);
    }

    if (this.#match("LEFT_PAREN")) {
      const expr = this.#expression();
      this.#consume("RIGHT_PAREN", "Expected ')' after expression.");
      return new Grouping(expr);
    }

    throw this.#error(this.#peek(), "Expected expression.");
  }

  #synchronize() {
    this.#advance();

    while (!this.#isAtEnd()) {
      if (this.#previous().type === "SEMICOLON") {
        return;
      }

      switch (this.#peek().type) {
        case "CLASS":
        case "FUN":
        case "VAR":
        case "FOR":
        case "IF":
        case "WHILE":
        case "PRINT":
        case "RETURN":
          return;
      }

      this.#advance();
    }
  }
}

export class ParseError extends Error {
  constructor() {
    super("");
    this.name = "ParseError";
  }
}
