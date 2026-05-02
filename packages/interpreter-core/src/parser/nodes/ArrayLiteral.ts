import type { Token } from "../../lexer/token";
import type { Expression } from "../ast";

export class ArrayLiteral implements Expression {
  expressionNode: true;

  constructor(
    public token: Token,
    public elements: Expression[],
  ) {}

  tokenLiteral() {
    return this.token.Literal;
  }

  toString() {
    return this.elements.map((e) => e.toString()).join(", ");
  }
}