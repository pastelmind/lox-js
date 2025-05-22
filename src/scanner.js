/** @import { TokenType } from './token-type.js' */
/** @import { Reporter } from './reporter.js' */

import { Token } from "./token.js";

/** @type {Record<string, TokenType>} */
const KEYWORDS = {
  and: "AND",
  class: "CLASS",
  else: "ELSE",
  false: "FALSE",
  for: "FOR",
  fun: "FUN",
  if: "IF",
  nil: "NIL",
  or: "OR",
  print: "PRINT",
  return: "RETURN",
  super: "SUPER",
  this: "THIS",
  true: "TRUE",
  var: "VAR",
  while: "WHILE",
};

export class Scanner {
  /** @readonly */
  #reporter;

  /** @readonly */
  #source;
  /** @type {Token[]} */
  #tokens = [];

  // Track current source code position

  /** Index of the first character in the lexeme */
  #start = 0;
  /** Index of the current character in the lexeme */
  #current = 0;
  /** Current line number */
  #line = 1;

  /**
   * @param {string} source
   * @param {Reporter} reporter
   */
  constructor(source, reporter) {
    this.#source = source;
    this.#reporter = reporter;
  }

  /**
   * @returns {readonly Token[]}
   */
  scanTokens() {
    while (!this.#isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.#start = this.#current;
      this.#scanToken();
    }

    this.#tokens.push(new Token("EOF", "", null, this.#line));
    return this.#tokens;
  }

  /** Scans a single token. */
  #scanToken() {
    const c = this.#advance();
    switch (c) {
      case "(":
        this.#addToken("LEFT_PAREN");
        break;
      case ")":
        this.#addToken("RIGHT_PAREN");
        break;
      case "{":
        this.#addToken("LEFT_BRACE");
        break;
      case "}":
        this.#addToken("RIGHT_BRACE");
        break;
      case ",":
        this.#addToken("COMMA");
        break;
      case ".":
        this.#addToken("DOT");
        break;
      case "-":
        this.#addToken("MINUS");
        break;
      case "+":
        this.#addToken("PLUS");
        break;
      case ";":
        this.#addToken("SEMICOLON");
        break;
      case "*":
        this.#addToken("STAR");
        break;
      case "!":
        this.#addToken(this.#match("=") ? "BANG_EQUAL" : "BANG");
        break;
      case "=":
        this.#addToken(this.#match("=") ? "EQUAL_EQUAL" : "EQUAL");
        break;
      case "<":
        this.#addToken(this.#match("=") ? "LESS_EQUAL" : "LESS");
        break;
      case ">":
        this.#addToken(this.#match("=") ? "GREATER_EQUAL" : "GREATER");
        break;
      case "/":
        if (this.#match("/")) {
          // A comment goes until the end of the line.
          while (this.#peek() !== "\n" && !this.#isAtEnd()) this.#advance();
        } else {
          this.#addToken("SLASH");
        }
        break;

      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.#line++;
        break;

      case '"':
        this.#string();
        break;

      default:
        if (isDigit(c)) {
          this.#number();
        } else if (isAlpha(c)) {
          this.#identifier();
        } else {
          this.#reporter.error(this.#line, `Unexpected character: '${c}'`);
        }
      // Keep scanning so that we report all errors.
    }
  }

  /**
   * @returns {boolean}
   */
  #isAtEnd() {
    return this.#current >= this.#source.length;
  }

  /**
   * Check if the next character in the source code equals {@linkcode expected}.
   * If so, consume it and return true. Otherwise, return false.
   * @param {string} expected
   * @returns {boolean}
   */
  #match(expected) {
    if (this.#isAtEnd()) return false;
    if (this.#source[this.#current] !== expected) return false;

    this.#current++;
    return true;
  }

  /**
   * Consumes and returns the next character in the source code.
   * @returns {string}
   */
  #advance() {
    const c = this.#source.at(this.#current++);
    if (c === undefined) {
      throw new Error("Unexpected end of input");
    }
    return c;
  }

  /**
   * Returns the next character in the source code, or `null` if at the end.
   * @returns {string | null}
   */
  #peek() {
    if (this.#isAtEnd()) return null;
    return this.#source[this.#current];
  }

  /**
   * Returns the second next character in the source code, or `null` if at the
   * end.
   * @returns {string | null}
   */
  #peekNext() {
    if (this.#current + 1 >= this.#source.length) return null;
    return this.#source[this.#current + 1];
  }

  /**
   * Adds the current lexeme to the list of tokens.
   * @param {TokenType} type
   * @param {number | string | null} literal
   */
  #addToken(type, literal = null) {
    const text = this.#source.slice(this.#start, this.#current);
    this.#tokens.push(new Token(type, text, literal, this.#line));
  }

  /**
   * Parses a string literal.
   */
  #string() {
    while (this.#peek() !== '"' && !this.#isAtEnd()) {
      if (this.#peek() === "\n") {
        this.#line++;
      }
      this.#advance();
    }

    if (this.#isAtEnd()) {
      this.#reporter.error(this.#line, "Unterminated string.");
      return;
    }

    // Closing '"'
    this.#advance();

    const value = this.#source.slice(this.#start + 1, this.#current - 1);
    this.#addToken("STRING", value);
  }

  /**
   * Parses a number literal.
   */
  #number() {
    while (isDigit(this.#peek())) {
      this.#advance();
    }

    // Look for a fractional part.
    if (this.#peek() === "." && isDigit(this.#peekNext())) {
      // Consume the ".".
      this.#advance();

      while (isDigit(this.#peek())) {
        this.#advance();
      }
    }

    const value = Number.parseFloat(
      this.#source.slice(this.#start, this.#current),
    );
    this.#addToken("NUMBER", value);
  }

  /**
   * Parses an identifier.
   */
  #identifier() {
    while (isAlphaNumeric(this.#peek())) {
      this.#advance();
    }

    const text = this.#source.slice(this.#start, this.#current);
    const type = KEYWORDS[text] ?? "IDENTIFIER";
    this.#addToken(type);
  }
}

/**
 * @param {string | null} c
 * @returns {boolean}
 */
function isDigit(c) {
  if (typeof c !== "string") {
    return false;
  }

  if (c.length !== 1) {
    throw new Error(`Expected a single character, got '${c}'`);
  }

  const code = c.charCodeAt(0);
  return 48 <= code && code <= 57;
}

/**
 * @param {string | null} c
 * @returns {boolean}
 */
function isAlpha(c) {
  if (typeof c !== "string") {
    return false;
  }

  if (c.length !== 1) {
    throw new Error(`Expected a single character, got '${c}'`);
  }

  const code = c.charCodeAt(0);
  return (
    (97 <= code && code <= 122) || // a-z
    (65 <= code && code <= 90) || // A-Z
    c === "_"
  );
}

/**
 * @param {string | null} c
 * @returns {boolean}
 */
function isAlphaNumeric(c) {
  return isAlpha(c) || isDigit(c);
}
