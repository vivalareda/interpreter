import { type Token } from "../../lexer/token";
import { type Expression, type Statement } from "../ast";
import { type Identifier } from "./Identifier";

export class LetStatement implements Statement {
  statementNode = true as const;

  constructor(
    public Token: Token,
    public Identifier: Identifier,
    public Value: Expression,
  ) { }

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `${this.tokenLiteral()} ${this.Identifier.Name} = ${this.Value.toString()};`;
  }
}