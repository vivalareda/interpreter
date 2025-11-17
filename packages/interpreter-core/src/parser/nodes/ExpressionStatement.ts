import type { Statement, Expression } from "../ast.js";
import type { Token } from "../../lexer/token.js";

export class ExpressionStatement implements Statement {
  statementNode = true as const;

  constructor(
    public Token: Token,
    public Expression: Expression
  ) { }

  tokenLiteral() {
    return this.Token.Literal;
  };

  toString() {
    return this.Expression?.toString() || '';
  }
};
