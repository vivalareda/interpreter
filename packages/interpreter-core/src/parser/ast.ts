export * from "../parser/nodes/LetStatement.js";
export * from "../parser/nodes/ReturnStatement.js";
export * from "../parser/nodes/PrefixExpression.js";
export * from "../parser/nodes/Identifier.js";
export * from "../parser/nodes/ExpressionStatement.js";

export type Node = Statement | Expression | Program;

export interface Statement {
  tokenLiteral: () => string,
  statementNode: true;
}

export interface Expression {
  tokenLiteral: () => String
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

