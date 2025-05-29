import { AstPrinter } from "./ast-printer.js";
import { Binary, Grouping, Literal, Unary } from "./expression.js";
import { Token } from "./token.js";

const expression = new Binary(
  new Unary(new Token("MINUS", "-", null, 1), new Literal(123)),
  new Token("STAR", "*", null, 1),
  new Grouping(new Literal(45.67)),
);

console.log(new AstPrinter().print(expression));
