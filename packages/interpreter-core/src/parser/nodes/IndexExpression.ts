import type { Expression } from "../ast.js";
import type { Token } from "../../lexer/token.js";

export class IndexExpression implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Left: Expression,
    public Index: Expression
  ) { };

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `(${this.Left.toString()}[${this.Index.toString()}])`;
  }
}
