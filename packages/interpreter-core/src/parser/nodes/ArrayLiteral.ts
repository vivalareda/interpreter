import type { Token } from "../../lexer/token.js";
import type { Expression } from "../ast.js";

export class ArrayLiteral implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Elements: Expression[],
  ) { };

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return "[" + this.Elements.map((el) => el.toString()).join(", ") + "]";
  }

}
