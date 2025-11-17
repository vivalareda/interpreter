import type { Token } from "../../lexer/token.js";
import type { Expression } from "../ast.js";

export type KeyValuePair<K, V> = {
  key: K,
  value: V
};

export class HashLiteral implements Expression {
  expressionNode = true as const;
  Pairs: Array<KeyValuePair<Expression, Expression>>;


  constructor(
    public Token: Token,
  ) {
    this.Pairs = [];
  };

  tokenLiteral() {
    return this.Token.Literal;
  }

  toString() {
    return `{${this.Pairs.map(pair => `${pair.key};${pair.value}`).join(", ")}}`;
  }
}
