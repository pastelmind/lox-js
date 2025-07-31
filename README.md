# Lox.js

An interpreter for the Lox language, written in JavaScript with TypeScript type annotations.

## Grammar:

```ebnf
program    -> declaration* EOF ;
declaration -> var_decl
             | statement ;
var_decl   -> "var" IDENTIFIER ( "=" expression )? ";" ;

statement  -> expr_stmt
            | print_stmt 
            | block ;
expr_stmt  -> expression ";" ;
print_stmt -> "print" expression ";" ;
block      -> "{" declaration* "}" ;

expression -> comma ;
comma      -> ternary ( "," ternary ) ;
ternary    -> assignment ( "?" assignment ":" assignment )* ;
assignment -> IDENTIFIER "=" assignment
            | equality ;
equality   -> comparison ( ( "==" | "!=" ) comparison )* ;
comparison -> term ( ( "<" | "<=" | ">" | ">=" ) term )* ;
term       -> factor ( ( "-" | "+" ) factor )* ;
factor     -> unary ( ( "/" | "*" ) unary )* ;
unary      -> ( "-" | "!" ) unary
            | primary ;
primary    -> NUMBER | STRING | "false" | "true" | "nil"
            | "(" expression ")"
            | IDENTIFIER ;
```

Notes:

- Assignment operator has higher precedence than ternary operator (like JavaScript)