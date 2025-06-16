# Lox.js

An interpreter for the Lox language, written in JavaScript with TypeScript type annotations.

## Grammar:

```ebnf
expression -> comma ;
comma      -> ternary ( "," ternary ) ;
ternary    -> equality ( "?" equality ":" equality )* ;
equality   -> comparison ( ( "==" | "!=" ) comparison )* ;
comparison -> term ( ( "<" | "<=" | ">" | ">=" ) term )* ;
term       -> factor ( ( "-" | "+" ) factor )* ;
factor     -> unary ( ( "/" | "*" ) unary )* ;
unary      -> ( "-" | "!" ) unary
            | primary ;
primary    -> NUMBER | STRING | "false" | "true" | "nil"
            | "(" expression ")" ;
```