import type { Token } from "../../lexer/token.js";
import type { Expression } from "../ast.js";

export class Identifier implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Name: string,
  ) { }

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return this.Name;
  }
}
