export * from "./nodes/ArrayLiteral";
export * from "./nodes/ExpressionStatement";
export * from "./nodes/Identifier";
export * from "./nodes/LetStatement";
export * from "./nodes/PrefixExpression";
export * from "./nodes/ReturnStatement";

export type Node = Statement | Expression | Program;

export interface Statement {
  tokenLiteral: () => string;
  statementNode: true;
}

export interface Expression {
  tokenLiteral: () => String;
  expressionNode: true;
}

export class Program {
  statements: Statement[];
  constructor() {
    this.statements = [];
  }

  toString(): string {
    let out = "";

    for (const stmt of this.statements) {
      out += stmt.toString();
    }

    return out;
  }
}