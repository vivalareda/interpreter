import type { Token } from "../../lexer/token";
import type { Expression, Statement } from "../ast";

export class AssignmentStatement implements Statement {
  statementNode = true as const;
  constructor(
    public Token: Token,
    public Identifier: Expression,
    public Value: Expression,
  ) {}

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `${this.tokenLiteral()} ${this.Identifier} = ${this.Value};`;
  }
}
