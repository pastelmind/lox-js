import { readFile } from "node:fs/promises";
import * as readline from "node:readline/promises";
import { parseArgs } from "node:util";
import { AstPrinter } from "./ast-printer.js";
import { Parser } from "./parser.js";
import { Reporter } from "./reporter.js";
import { Scanner } from "./scanner.js";

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
  run(code);
}

async function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  for (;;) {
    const line = await rl.question("> ");
    if (!line) break;
    run(line);
  }

  rl.close();
}

/**
 * @param {string} source
 */
function run(source) {
  const reporter = new Reporter();
  const scanner = new Scanner(source, reporter);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, reporter);
  const expression = parser.parse();

  // Stop if there was a syntax error
  if (!expression) {
    return;
  }

  console.log(new AstPrinter().print(expression));
}
