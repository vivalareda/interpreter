import type { Token } from "../../lexer/token.js";
import type { Identifier } from "./Identifier.js";
import type { BlockStatement } from "./IfExpression.js";
import type { Expression } from "../ast.js";

export class FunctionLiteral implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Params: Identifier[],
    public Body: BlockStatement,
  ) { };

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    const params = this.Params.map(p => p.Name).join(", ");
    return `${this.tokenLiteral()}(${params}) ${this.Body.toString()}`;
  }
}
