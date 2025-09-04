# Lox.js

An interpreter for the Lox language, written in JavaScript with TypeScript type annotations.

## Grammar:

```ebnf
program     -> declaration* EOF ;
declaration -> fun_decl
             | var_decl
             | statement ;

fun_decl   -> "fun" function ;
function   -> IDENTIFIER "(" parameters? ")" block ;
parameters -> IDENTIFIER ( "," IDENTIFIER )* ;

var_decl   -> "var" IDENTIFIER ( "=" expression )? ";" ;

statement  -> expr_stmt
            | for_stmt
            | if_stmt
            | print_stmt
            | return_stmt
            | while_stmt
            | block ;
expr_stmt  -> expression ";" ;
for_stmt   -> "for" "(" ( var_decl | expr_stmt | ";" )
              expression? ";"
              expression? ")" statement;
if_stmt    -> "if" "(" expression ")" statement ( "else" statement )? ;
print_stmt -> "print" expression ";" ;
return_stmt -> "return" expression? ";" ;
while_stmt -> "while" "(" expression ")" statement;
block      -> "{" declaration* "}" ;

expression -> comma ;
comma      -> ternary ( "," ternary ) ;
ternary    -> assignment ( "?" assignment ":" assignment )* ;
assignment -> IDENTIFIER "=" assignment
            | logic_or ;
logic_or   -> logic_and ( "or" logic_and )* ;
logic_and  -> equality ( "and" equality )* ;
equality   -> comparison ( ( "==" | "!=" ) comparison )* ;
comparison -> term ( ( "<" | "<=" | ">" | ">=" ) term )* ;
term       -> factor ( ( "-" | "+" ) factor )* ;
factor     -> unary ( ( "/" | "*" ) unary )* ;
unary      -> ( "-" | "!" ) unary
            | call ;
call       -> primary ( "(" arguments? ")" )* ;
arguments  -> ternary ( "," ternary )* ;
primary    -> NUMBER | STRING | "false" | "true" | "nil"
            | "(" expression ")"
            | IDENTIFIER ;
```

Notes:

- Assignment operator has higher precedence than ternary operator (like JavaScript)
