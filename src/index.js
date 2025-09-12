import { readFile } from "node:fs/promises";
import * as readline from "node:readline/promises";
import { parseArgs } from "node:util";
import { Interpreter } from "./interpreter.js";
import { Parser } from "./parser.js";
import { Reporter } from "./reporter.js";
import { Resolver } from "./resolver.js";
import { Scanner } from "./scanner.js";

const interpreter = new Interpreter();

await main();

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(
      `
Usage: lox-js [options] <filename>

Options:

    -h, --help      Show this help message
`.trim(),
    );
    return;
  }

  if (positionals.length > 1) {
    console.error("Error: Too many positional arguments, expected 0 or 1");
    process.exitCode = 64; // sysexits EX_USAGE
  } else if (positionals.length === 1) {
    await runFile(positionals[0]);
  } else {
    await runPrompt();
  }
}

/**
 * @param {string} filename
 */
async function runFile(filename) {
  console.debug(`Running file: ${filename}`);
  const code = await readFile(filename, "utf-8");
  const reporter = new Reporter();
  run(code, reporter);

  // Indicate an error in the exit code.
  if (reporter.hadError) process.exitCode = 65;
  if (reporter.hadRuntimeError) process.exitCode = 70;
}

async function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (;;) {
    const line = await rl.question("> ");
    if (!line) break;
    run(line, new Reporter(), true);
  }

  rl.close();
}

/**
 * @param {string} source
 * @param {Reporter} reporter
 * @param {boolean=} allowSingleExpr Whether to allow running a single expression
 */
function run(source, reporter, allowSingleExpr = false) {
  const scanner = new Scanner(source, reporter);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, reporter);

  // Use heuristic to determine if the input is a single expression.
  if (allowSingleExpr && tokens.every((token) => token.type !== "SEMICOLON")) {
    // Attempt to parse a single expression
    const expr = parser.parseAsExpression();

    if (expr && !reporter.hadError) {
      interpreter.interpretExpression(expr, reporter);
    }

    return;
  }

  const statements = parser.parse();

  // Stop if there was a syntax error
  if (reporter.hadError) {
    return;
  }

  const resolver = new Resolver(interpreter, reporter);
  resolver.resolve(...statements);

  // Stop if there was a resolution error
  if (reporter.hadError) {
    return;
  }

  interpreter.interpret(statements, reporter);
}
