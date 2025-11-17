import type { Statement } from "../ast.js";
import type { Expression } from "../ast.js";
import { type Token } from "../../lexer/token.js";

export class IfExpression implements Expression {
  expressionNode = true as const;

  constructor(
    public Token: Token,
    public Condition: Expression,
    public Consequence: BlockStatement,
    public Alternative: BlockStatement = null,
  ) { }

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    let out = `${this.tokenLiteral()} ${this.Condition.toString()} ${this.Consequence.toString()}`;
    if (this.Alternative) {
      out += `else ${this.Alternative.toString()}`;
    }
    return out;
  }
}

export class BlockStatement implements Statement {
  statementNode = true as const;

  statements: Statement[];

  constructor(
    public Token: Token
  ) {
    this.statements = [];
  }

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    let out = ""
    for (const stmt of this.statements) {
      out += stmt
    }
    return out;
  }
}
