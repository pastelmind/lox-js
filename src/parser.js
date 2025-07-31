/** @import { Expr } from './expression.js' */
/** @import { Reporter } from './reporter.js' */
/** @import { Token } from './token.js'; */
/** @import { TokenType } from './token-type.js' */

import {
  Assign,
  Binary,
  Grouping,
  Literal,
  Ternary,
  Unary,
  Variable,
} from "./expression.js";
import { Block, Expression, Print, Stmt, Var } from "./statement.js";

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
   * @returns {(Stmt)[]}
   */
  parse() {
    const statements = [];
    while (!this.#isAtEnd()) {
      const stmt = this.#declaration();
      if (stmt) {
        statements.push(stmt);
      }
    }
    return statements;
  }

  /**
   * @returns {boolean}
   */
  #isAtEnd() {
    return this.#peek().type === "EOF";
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
   * Parses a declaration.
   * This returns `undefined` when synchronizing after a parse error.
   * @returns {Stmt | undefined}
   */
  #declaration() {
    try {
      if (this.#match("VAR")) {
        return this.#varDeclaration();
      }
      return this.#statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.#synchronize();
        return;
      }

      throw error;
    }
  }

  /**
   * Parses a variable declaration statement.
   */
  #varDeclaration() {
    const name = this.#consume("IDENTIFIER", "Expected variable name.");

    const initializer = this.#match("EQUAL") ? this.#expression() : undefined;

    this.#consume("SEMICOLON", "Expected ';' after variable declaration.");
    return new Var(name, initializer);
  }

  #statement() {
    if (this.#match("PRINT")) {
      return this.#printStatement();
    }

    if (this.#match("LEFT_BRACE")) {
      return new Block(this.#block());
    }

    // Since expression statements are difficult to deduce from the first token,
    // we parse them as the last (fallthrough) case.
    return this.#expressionStatement();
  }

  /**
   * Parses a print statement.
   */
  #printStatement() {
    const value = this.#expression();
    this.#consume("SEMICOLON", "Expected ';' after value.");
    return new Print(value);
  }

  /**
   * Parses an expression statement.
   */
  #expressionStatement() {
    const expr = this.#expression();
    this.#consume("SEMICOLON", "Expected ';' after expression.");
    return new Expression(expr);
  }

  /**
   * Parses the contents of a block statement.
   * @returns {Stmt[]}
   */
  #block() {
    const statements = [];

    while (!this.#check("RIGHT_BRACE") && !this.#isAtEnd()) {
      const stmt = this.#declaration();
      if (stmt) {
        statements.push(stmt);
      }
    }

    this.#consume("RIGHT_BRACE", "Expected '}' after block.");
    return statements;
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
    let expr = this.#assignment();
    let lastTernary = null;

    while (this.#match("QUESTION")) {
      const trueExpr = this.#assignment();
      this.#consume("COLON", "Expected ':' after '?' in ternary expression.");
      const falseExpr = this.#assignment();

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
   * Parses an assignment expression.
   * @returns {Expr}
   */
  #assignment() {
    const expr = this.#equality();

    if (this.#match("EQUAL")) {
      const equals = this.#previous();
      const value = this.#assignment();

      // Check if the left-hand expression is a storage location.
      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }

      // Report the error but do not throw, since the parser is not in a
      // confused state and can continue parsing.
      this.#error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #equality() {
    let expr = this.#comparison();

    while (this.#match("BANG_EQUAL", "EQUAL_EQUAL")) {
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

    if (this.#match("IDENTIFIER")) {
      return new Variable(this.#previous());
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
