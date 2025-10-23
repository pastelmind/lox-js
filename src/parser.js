/** @import { Expr } from './expression.js' */
/** @import { Reporter } from './reporter.js' */
/** @import { Token } from './token.js'; */
/** @import { TokenType } from './token-type.js' */

import { FUNCTION_MAX_ARGS } from "./constants.js";
import {
  Assign,
  Binary,
  Call,
  GetExpr,
  Grouping,
  Literal,
  Logical,
  SetExpr,
  Ternary,
  This,
  Unary,
  Variable,
} from "./expression.js";
import {
  Block,
  Class,
  Expression,
  FunctionDecl,
  If,
  Print,
  Return,
  Stmt,
  Var,
  While,
} from "./statement.js";

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
   * Parses the tokens as a sequence of statements.
   * @returns {Stmt[]}
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
   * Parses the tokens as a single expression.
   * Returns `undefined` if the parsing fails.
   * @returns {Expr | undefined}
   */
  parseAsExpression() {
    try {
      const expression = this.#expression();
      this.#consume("EOF", "Expected end of input after expression.");
      return expression;
    } catch (error) {
      if (error instanceof ParseError) {
        return;
      }
      throw error;
    }
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
    this.#reporter.error(token, message);
    return new ParseError();
  }

  /**
   * Parses a declaration.
   * This returns `undefined` when synchronizing after a parse error.
   * @returns {Stmt | undefined}
   */
  #declaration() {
    try {
      if (this.#match("CLASS")) {
        return this.#classDeclaration();
      }
      if (this.#match("FUN")) {
        return this.#functionDeclaration("function");
      }
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
   * Parses a class declaration statement.
   * @returns {Class}
   */
  #classDeclaration() {
    const name = this.#consume("IDENTIFIER", "Expected class name.");
    this.#consume("LEFT_BRACE", "Expected '{' before class body.");

    /** @type {FunctionDecl[]} */
    const methods = [];
    while (!this.#check("RIGHT_BRACE") && !this.#isAtEnd()) {
      methods.push(this.#functionDeclaration("method"));
    }

    this.#consume("RIGHT_BRACE", "Expected '}' after class body.");
    return new Class(name, methods);
  }

  /**
   * Parses a variable declaration statement.
   * @returns {Var}
   */
  #varDeclaration() {
    const name = this.#consume("IDENTIFIER", "Expected variable name.");

    const initializer = this.#match("EQUAL") ? this.#expression() : undefined;

    this.#consume("SEMICOLON", "Expected ';' after variable declaration.");
    return new Var(name, initializer);
  }

  #statement() {
    if (this.#match("FOR")) {
      return this.#forStatement();
    }

    if (this.#match("IF")) {
      return this.#ifStatement();
    }

    if (this.#match("PRINT")) {
      return this.#printStatement();
    }

    if (this.#match("RETURN")) {
      return this.#returnStatement();
    }

    if (this.#match("WHILE")) {
      return this.#whileStatement();
    }

    if (this.#match("LEFT_BRACE")) {
      return new Block(this.#block());
    }

    // Since expression statements are difficult to deduce from the first token,
    // we parse them as the last (fallthrough) case.
    return this.#expressionStatement();
  }

  /**
   * Parses a for-statement. (desugared to a while-statement)
   * @returns {Block | While}
   */
  #forStatement() {
    this.#consume("LEFT_PAREN", "Expected '(' after 'for'.");

    const initializer = this.#match("SEMICOLON")
      ? undefined
      : this.#match("VAR")
        ? this.#varDeclaration()
        : this.#expressionStatement();

    const condition = this.#check("SEMICOLON") ? undefined : this.#expression();
    this.#consume("SEMICOLON", "Expected ';' after for-loop condition.");

    const increment = this.#check("RIGHT_PAREN")
      ? undefined
      : this.#expression();
    this.#consume("RIGHT_PAREN", "Expected ')' after for-loop clauses.");

    // Work backwards to desugar the for-loop into a while-loop.

    let body = this.#statement();

    if (increment) {
      body = new Block([body, new Expression(increment)]);
    }

    body = new While(condition ?? new Literal(true), body);

    if (initializer) {
      body = new Block([initializer, body]);
    }

    return body;
  }

  /**
   * Parses an if-statement.
   * @returns {If}
   */
  #ifStatement() {
    this.#consume("LEFT_PAREN", "Expected '(' after 'if'.");
    const condition = this.#expression();
    this.#consume("RIGHT_PAREN", "Expected ')' after if condition.");

    const thenBranch = this.#statement();
    let elseBranch;

    // Handle the dangling else problem by assigning the else-branch to the
    // nearest (current) if-statement.
    if (this.#match("ELSE")) {
      elseBranch = this.#statement();
    }

    return new If(condition, thenBranch, elseBranch);
  }

  /**
   * Parses a print statement.
   * @returns {Print}
   */
  #printStatement() {
    const value = this.#expression();
    this.#consume("SEMICOLON", "Expected ';' after value.");
    return new Print(value);
  }

  /**
   * Parses a return statement.
   * @returns {Return}
   */
  #returnStatement() {
    const keyword = this.#previous();
    let value;
    if (!this.#check("SEMICOLON")) {
      value = this.#expression();
    }

    this.#consume("SEMICOLON", "Expected ';' after return value.");
    return new Return(keyword, value);
  }

  /**
   * Parses a while-statement.
   * @returns {While}
   */
  #whileStatement() {
    this.#consume("LEFT_PAREN", "Expected '(' after 'while'.");
    const condition = this.#expression();
    this.#consume("RIGHT_PAREN", "Expected ')' after while condition.");
    const body = this.#statement();

    return new While(condition, body);
  }

  /**
   * Parses an expression statement.
   * @returns {Expression}
   */
  #expressionStatement() {
    const expr = this.#expression();
    this.#consume("SEMICOLON", "Expected ';' after expression.");
    return new Expression(expr);
  }

  /**
   * Parses a function declaration statement.
   * @param {string} kind
   * @returns {FunctionDecl}
   */
  #functionDeclaration(kind) {
    const name = this.#consume("IDENTIFIER", `Expected ${kind} name.`);
    this.#consume("LEFT_PAREN", `Expected '(' after ${kind} name.`);

    const parameters = [];
    if (!this.#check("RIGHT_PAREN")) {
      do {
        if (parameters.length >= FUNCTION_MAX_ARGS) {
          this.#error(
            this.#peek(),
            `Can't have more than ${FUNCTION_MAX_ARGS} parameters.`,
          );
        }

        parameters.push(
          this.#consume("IDENTIFIER", "Expected parameter name."),
        );
      } while (this.#match("COMMA"));
    }
    this.#consume("RIGHT_PAREN", `Expected ')' after parameters.`);

    this.#consume("LEFT_BRACE", `Expected '{' before ${kind} body.`);
    const body = this.#block();

    return new FunctionDecl(name, parameters, body);
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
    const expr = this.#or();

    if (this.#match("EQUAL")) {
      const equals = this.#previous();
      const value = this.#assignment();

      // Check if the left-hand expression is a storage location.
      // This includes variables and get-expressions.

      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }

      if (expr instanceof GetExpr) {
        return new SetExpr(expr.object, expr.name, value);
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
  #or() {
    let expr = this.#and();

    while (this.#match("OR")) {
      const operator = this.#previous();
      const right = this.#and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  /**
   * @returns {Expr}
   */
  #and() {
    let expr = this.#equality();

    while (this.#match("AND")) {
      const operator = this.#previous();
      const right = this.#equality();
      expr = new Logical(expr, operator, right);
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

    return this.#call();
  }

  /**
   * Parses a function call expression.
   * @returns {Expr}
   */
  #call() {
    let expr = this.#primary();

    while (true) {
      if (this.#match("LEFT_PAREN")) {
        expr = this.#finishCall(expr);
      } else if (this.#match("DOT")) {
        const name = this.#consume(
          "IDENTIFIER",
          "Expected property name after '.'.",
        );
        expr = new GetExpr(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  /**
   * Finishes parsing a (possibly chained) function call expression.
   * @param {Expr} callee
   */
  #finishCall(callee) {
    const args = [];
    if (!this.#check("RIGHT_PAREN")) {
      do {
        if (args.length >= FUNCTION_MAX_ARGS) {
          this.#error(this.#peek(), "Cannot have more than 255 arguments.");
        }
        args.push(this.#ternary());
      } while (this.#match("COMMA"));
    }

    const paren = this.#consume("RIGHT_PAREN", "Expected ')' after arguments.");
    return new Call(callee, paren, args);
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

    if (this.#match("THIS")) {
      return new This(this.#previous());
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
