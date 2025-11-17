import type { Token } from "../../lexer/token.js";
import type { Expression } from "../ast.js";

export class StringLiteral implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Value: string,
  ) { };

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `"${this.Value}"`;
  }
}
