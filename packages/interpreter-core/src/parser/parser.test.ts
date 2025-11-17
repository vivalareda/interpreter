import { describe, expect, test } from "bun:test.js";
import { Lexer } from "../lexer/lexer.js";
import { Parser } from "../parser/parser.js";
import { type Expression, ExpressionStatement, Identifier, LetStatement, ReturnStatement, PrefixExpression } from "../parser/ast.js";
import { IntegerLiteral } from "./nodes/IntegerLiteral.js";
import { InfixExpression } from "./nodes/InfixExpression.js";
import { BooleanLiteral } from "./nodes/BooleanExpression.js";
import { BlockStatement, IfExpression } from "./nodes/IfExpression.js";
import { FunctionLiteral } from "./nodes/FunctionLiteral.js";
import { FunctionCallExpression } from "./nodes/CallExpression.js";
import { StringLiteral } from "./nodes/StringLiteral.js";
import { ArrayLiteral } from "./nodes/ArrayLiteral.js";
import type { IndexExpression } from "./nodes/IndexExpression.js";
import { HashLiteral } from "./nodes/HashLiteral.js";

describe("parser", () => {
  test("string literal", () => {
    const input = '"Hello world!";'

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);


    const stmt = (program.statements[0] as ExpressionStatement);
    expect((stmt.Expression as StringLiteral).Value).toBe("Hello world!");
  });

  test("let statements", () => {
    const input = `
MET MOI CA ICITTE x = 5;
MET MOI CA ICITTE y = 10;
MET MOI CA ICITTE foobar = 838383;
`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    expect(program.statements.length).toBe(3);

    const tests = [
      { expectedIdentifier: "x", expectedValue: 5 },
      { expectedIdentifier: "y", expectedValue: 10 },
      { expectedIdentifier: "foobar", expectedValue: 838383 },
    ];

    for (let i = 0; i < tests.length; i++) {
      const stmt = program.statements[i];
      testLetStatement(stmt, tests[i].expectedIdentifier, tests[i].expectedValue);
    }
  });

  test("return statements", () => {
    const input = `
TOKEBEC 5;
TOKEBEC 10;
TOKEBEC 993322;
`
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    expect(program.statements.length).toBe(3);
    checkParserErrors(parser);
    for (const stmt of program.statements) {
      expect(stmt).toBeInstanceOf(ReturnStatement);
      expect(stmt.tokenLiteral()).toBe("TOKEBEC");
    }
  });

  test("expression statements", () => {
    const input = "foobar;"

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    expect(program.statements.length).toBe(1);

    const stmt = program.statements[0];
    expect(stmt).toBeInstanceOf(ExpressionStatement)

    const expr = (stmt as ExpressionStatement).Expression;
    expect(expr).toBeInstanceOf(Identifier);

    expect((expr as Identifier).Name).toBe("foobar");
    expect(expr.tokenLiteral()).toBe("foobar");
  });

  test("integer expression", () => {
    const input = "5;"

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0]).toBeInstanceOf(ExpressionStatement);

    const stmt = program.statements[0] as ExpressionStatement;
    const literal = stmt.Expression as IntegerLiteral
    expect(literal).toBeInstanceOf(IntegerLiteral);
    expect(literal.Value).toBe(5);
    expect(literal.tokenLiteral()).toBe("5");
  })

  describe("prefix expressions", () => {
    const prefixTests = [
      { input: "!5;", operator: "!", value: 5 },
      { input: "-15;", operator: "-", value: 15 },
    ];

    for (const tt of prefixTests) {
      test(`prefix expression: ${tt.operator}${tt.value}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        expect(program.statements).toHaveLength(1);
        const stmt = program.statements[0] as ExpressionStatement;
        const exp = stmt.Expression as PrefixExpression;

        expect(exp).toBeInstanceOf(PrefixExpression);
        expect(exp.Operator).toBe(tt.operator);
        testLiteralExpression(exp.Right, tt.value);
      });
    }
  })

  describe("infix expressions", () => {
    const infixTests = [
      { input: "5 + 5;", left: 5, operator: "+", right: 5 },
      { input: "5 - 5;", left: 5, operator: "-", right: 5 },
      { input: "5 * 5;", left: 5, operator: "*", right: 5 },
      { input: "5 / 5;", left: 5, operator: "/", right: 5 },
      { input: "5 > 5;", left: 5, operator: ">", right: 5 },
      { input: "5 < 5;", left: 5, operator: "<", right: 5 },
      { input: "5 == 5;", left: 5, operator: "==", right: 5 },
      { input: "5 != 5;", left: 5, operator: "!=", right: 5 },
      { input: "true == true", left: true, operator: "==", right: true },
      { input: "true != false", left: true, operator: "!=", right: false },
      { input: "false == false", left: false, operator: "==", right: false },
    ];

    for (const testCase of infixTests) {
      test(`infix expression: ${testCase.input}`, () => {
        const lexer = new Lexer(testCase.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        expect(program.statements).toHaveLength(1);
        const stmt = program.statements[0] as ExpressionStatement;
        expect(stmt.Expression).toBeInstanceOf(InfixExpression);

        const exp = stmt.Expression as InfixExpression;
        testInfixExpression(exp, testCase.left, testCase.operator, testCase.right);
      });
    }
  })

  describe("operator precedence parsing", () => {
    const tests = [
      { input: "-a * b", expected: "((-a) * b)" },
      { input: "!-a", expected: "(!(-a))" },
      { input: "a + b + c", expected: "((a + b) + c)" },
      { input: "a + b - c", expected: "((a + b) - c)" },
      { input: "a * b + c", expected: "((a * b) + c)" },
      { input: "a + b * c", expected: "(a + (b * c))" },
      { input: "a * b * c", expected: "((a * b) * c)" },
      { input: "a * b / c", expected: "((a * b) / c)" },
      { input: "a + b / c", expected: "(a + (b / c))" },
      { input: "a / b * c", expected: "((a / b) * c)" },
      { input: "a + b * c + d / e - f", expected: "(((a + (b * c)) + (d / e)) - f)" },
      { input: "5 > 4 == 3 < 4", expected: "((5 > 4) == (3 < 4))" },
      { input: "5 < 4 != 3 > 4", expected: "((5 < 4) != (3 > 4))" },
      { input: "3 + 4 * 5 == 3 * 1 + 4 * 5", expected: "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))" },
      { input: "a * [1, 2, 3, 4][b * c] * d", expected: "((a * ([1, 2, 3, 4][(b * c)])) * d)" },
      { input: "add(a * b[2], b[1], 2 * [1, 2][1])", expected: "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))" }
    ];

    for (const tt of tests) {
      test(`precedence: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  })

  describe("boolean expressions", () => {
    const tests = [
      { input: "true", expected: "true" },
      { input: "false", expected: "false" },
      { input: "3 > 5 == false", expected: "((3 > 5) == false)" },
    ]

    for (const tt of tests) {
      test(`boolean: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  });

  describe("grouped operator", () => {
    const tests = [
      { input: "1 + (2 + 3) + 4", expected: "((1 + (2 + 3)) + 4)" },
      { input: "(5 + 5) * 2", expected: "((5 + 5) * 2)" },
      { input: "2 / (5 + 5)", expected: "(2 / (5 + 5))" },
      { input: "-(5 + 5)", expected: "(-(5 + 5))" },
      { input: "!(true == true)", expected: "(!(true == true))", },
    ];

    for (const tt of tests) {
      test(`grouped: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  })

  test("if expressions", () => {
    const input = "AMETON QUE (x < y) { x }";

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0]).toBeInstanceOf(ExpressionStatement);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt.Expression).toBeInstanceOf(IfExpression);

    const ifExpr = stmt.Expression as IfExpression;

    expect(ifExpr.Condition).toBeInstanceOf(InfixExpression);
    testInfixExpression(ifExpr.Condition as InfixExpression, "x", "<", "y");

    expect(ifExpr.Consequence).toBeDefined();
    expect(ifExpr.Consequence!.statements.length).toBe(1);
    const consequenceStmt = ifExpr.Consequence!.statements[0] as ExpressionStatement;
    testLiteralExpression(consequenceStmt.Expression, "x");
  })

  test("if else expressions", () => {
    const input = "AMETON QUE (x < y) { x } SINON LA { y }";

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0]).toBeInstanceOf(ExpressionStatement);

    const stmt = program.statements[0] as ExpressionStatement;
    expect(stmt.Expression).toBeInstanceOf(IfExpression);

    const ifExpr = stmt.Expression as IfExpression;

    expect(ifExpr.Condition).toBeInstanceOf(InfixExpression);
    testInfixExpression(ifExpr.Condition as InfixExpression, "x", "<", "y");

    expect(ifExpr.Consequence).toBeDefined();
    expect(ifExpr.Consequence!.statements.length).toBe(1);
    const consequenceStmt = ifExpr.Consequence!.statements[0] as ExpressionStatement;
    testLiteralExpression(consequenceStmt.Expression, "x");

    expect(ifExpr.Alternative).toBeDefined();
    expect(ifExpr.Alternative!.statements.length).toBe(1);
    const alternativeStmt = ifExpr.Alternative!.statements[0] as ExpressionStatement;
    testLiteralExpression(alternativeStmt.Expression, "y");
  })

  test("function literal", () => {
    const input = `
JAI JAMAIS TOUCHER A MES FILLES(a, b)
x + y
SAUF UNE FOIS AU CHALET;
JAI JAMAIS TOUCHER A MES FILLES() SAUF UNE FOIS AU CHALET;
`
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    const expr = (program.statements[0] as ExpressionStatement).Expression
    const blockBody = (expr as FunctionLiteral).Body as BlockStatement;

    expect(program.statements.length).toBe(2);

    expect(expr).toBeInstanceOf(FunctionLiteral);
    expect(blockBody.statements.length).toBe(1);
    expect((blockBody.statements[0] as ExpressionStatement).Expression).toBeInstanceOf(InfixExpression);
  })

  describe("function parameter parsing", () => {
    const tests = [
      {
        input: "JAI JAMAIS TOUCHER A MES FILLES() SAUF UNE FOIS AU CHALET;",
        expectedParams: [],
      },
      {
        input: "JAI JAMAIS TOUCHER A MES FILLES(x) SAUF UNE FOIS AU CHALET;",
        expectedParams: ["x"],
      },
      {
        input: "JAI JAMAIS TOUCHER A MES FILLES(x, y, z) SAUF UNE FOIS AU CHALET;",
        expectedParams: ["x", "y", "z"],
      },
    ];

    for (const tt of tests) {
      test(`function parameters: ${tt.expectedParams.length} params`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const stmt = program.statements[0] as ExpressionStatement;
        const fn = stmt.Expression as FunctionLiteral;

        expect(fn.Params.length).toBe(tt.expectedParams.length);

        for (let i = 0; i < tt.expectedParams.length; i++) {
          expect(fn.Params[i]).toBeInstanceOf(Identifier);
          expect((fn.Params[i] as Identifier).Name).toBe(tt.expectedParams[i]);
        }
      });
    }
  });

  describe("call expression operator precedence parsing", () => {
    const tests = [
      {
        input: "add(b * c)",
        expected: "add((b * c))",
      },
      {
        input: "add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))",
        expected: "add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))",
      },
      {
        input: "add(a + b + c * d / f + g)",
        expected: "add((((a + b) + ((c * d) / f)) + g))",
      },
    ];

    for (const tt of tests) {
      test(`call precedence: ${tt.input}`, () => {
        const lexer = new Lexer(tt.input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParserErrors(parser);

        const actual = astToString(program.statements[0] as ExpressionStatement);
        expect(actual).toBe(tt.expected);
      });
    }
  });

  test("array literals", () => {
    const input = "[1, 2 * 2, 3 + 3]";

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const array = stmt.Expression as ArrayLiteral;

    if (!(array && ("Elements" in array))) {
      throw new Error("exp not ast.ArrayLiteral. got=" + stmt.Expression);
    }

    if (array.Elements.length !== 3) {
      throw new Error(`len(array.Elements) not 3. got=${array.Elements.length}`);
    }

    testLiteralExpression(array.Elements[0], 1);
    testInfixExpression((array.Elements[1] as InfixExpression), 2, "*", 2);
    testInfixExpression(array.Elements[2] as InfixExpression, 3, "+", 3);
  });

  test("parsing index expressions", () => {
    const input = "myArray[1 + 1]";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;

    expect(stmt).toBeInstanceOf(ExpressionStatement)
  })

  test("parsing empty hash literal", () => {
    const input = "{}";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.Expression as HashLiteral;

    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.Pairs.length).toBe(0);
  });

  test("parsing hash literals string keys", () => {
    const input = '{"one": 1, "two": 2, "three": 3}';
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.Expression as HashLiteral;

    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.Pairs.length).toBe(3);

    const expected: Record<string, number> = {
      "one": 1,
      "two": 2,
      "three": 3,
    };

    for (const [keyStr, expectedValue] of Object.entries(expected)) {
      const pair = hash.Pairs.find(p => (p.key as StringLiteral).Value === keyStr);


      expect(pair).toBeDefined();
      expect(pair.value).toBeInstanceOf(IntegerLiteral);
      expect((pair.value as IntegerLiteral).Value).toBe(expectedValue);
    }
  });

  test("parsing hash literals string keys", () => {
    const input = '{"one": 1, "two": 2, "three": 3}';
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.Expression as HashLiteral;

    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.Pairs.length).toBe(3);

    const expected: Record<string, number> = {
      "one": 1,
      "two": 2,
      "three": 3,
    };

    for (const [keyStr, expectedValue] of Object.entries(expected)) {
      const pair = hash.Pairs.find(p => (p.key as StringLiteral).Value === keyStr);
      expect(pair).toBeDefined();
      expect(pair!.value).toBeInstanceOf(IntegerLiteral);
      expect((pair!.value as IntegerLiteral).Value).toBe(expectedValue);
    }
  });

  test("parsing hash literals integer keys", () => {
    const input = "{1: 1, 2: 2, 3: 3}";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.Expression as HashLiteral;

    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.Pairs.length).toBe(3);

    const expected: Record<number, number> = {
      1: 1,
      2: 2,
      3: 3,
    };

    for (const pair of hash.Pairs) {
      const intLit = pair.key as IntegerLiteral;
      expect(intLit).toBeInstanceOf(IntegerLiteral);
      const expectedValue = expected[intLit.Value];
      testLiteralExpression(pair.value, expectedValue);
    }
  });

  test("parsing hash literals boolean keys", () => {
    const input = "{true: 1, false: 2}";
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.Expression as HashLiteral;

    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.Pairs.length).toBe(2);
  });

  test("parsing hash literals with expressions", () => {
    const input = '{"one": 0 + 1, "two": 10 - 8, "three": 15 / 5}';
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParserErrors(parser);

    const stmt = program.statements[0] as ExpressionStatement;
    const hash = stmt.Expression as HashLiteral;

    expect(hash).toBeInstanceOf(HashLiteral);
    expect(hash.Pairs.length).toBe(3);

    const tests: Record<string, (expr: Expression) => void> = {
      "one": (expr) => testInfixExpression(expr as InfixExpression, 0, "+", 1),
      "two": (expr) => testInfixExpression(expr as InfixExpression, 10, "-", 8),
      "three": (expr) => testInfixExpression(expr as InfixExpression, 15, "/", 5),
    };

    for (const pair of hash.Pairs) {
      const literal = pair.key as StringLiteral;
      expect(literal).toBeInstanceOf(StringLiteral);
      const testFunc = tests[literal.Value];
      expect(testFunc).toBeDefined();
      testFunc(pair.value);
    }
  });
})


function testLetStatement(stmt: any, name: string, value: any) {
  expect(stmt.tokenLiteral()).toBe("MET MOI CA ICITTE");
  expect(stmt).toBeInstanceOf(LetStatement);
  expect(stmt.Identifier.Name).toBe(name);
  expect(stmt.Identifier.tokenLiteral()).toBe(name);

  testLiteralExpression(stmt.Value, value);
}

function checkParserErrors(parser: Parser) {
  const errors = parser.errors;

  if (errors.length === 0) {
    return;
  }

  console.error(`parser has ${parser.errors.length} errors`);
  for (const error of parser.errors) {
    console.error(`parser error: ${error}`);
  }

  throw new Error(`parser had ${parser.errors.length} errors`);
}

function testLiteralExpression(expr: Expression, expected: number | boolean | string): void {
  if (typeof expected === "number") {
    expect(expr).toBeInstanceOf(IntegerLiteral);
    const intLit = expr as IntegerLiteral;
    expect(intLit.Value).toBe(expected);
  } else if (typeof expected === "boolean") {
    expect(expr).toBeInstanceOf(BooleanLiteral);
    const boolLit = expr as BooleanLiteral;
    expect(boolLit.Value).toBe(expected);
  } else if (typeof expected === "string") {
    expect(expr).toBeInstanceOf(Identifier);
    const ident = expr as Identifier;
    expect(ident.Name).toBe(expected);
  }
}

function testInfixExpression(
  expr: InfixExpression,
  leftValue: number | boolean | string,
  operator: string,
  rightValue: number | boolean | string
): void {
  expect(expr.Operator).toBe(operator);
  testLiteralExpression(expr.Left, leftValue);
  testLiteralExpression(expr.Right, rightValue);
}

function astToString(stmt: ExpressionStatement): string {
  return expressionToString(stmt.Expression);
}

function expressionToString(expr: Expression): string {
  if (expr instanceof IntegerLiteral) {
    return expr.Value.toString();
  }
  if (expr instanceof BooleanLiteral) {
    return expr.Value.toString();
  }
  if (expr instanceof Identifier) {
    return expr.Name;
  }
  if (expr instanceof PrefixExpression) {
    return `(${expr.Operator}${expressionToString(expr.Right)})`;
  }
  if (expr instanceof InfixExpression) {
    return `(${expressionToString(expr.Left)} ${expr.Operator} ${expressionToString(expr.Right)})`;
  }
  if (expr instanceof FunctionCallExpression) {
    const args = expr.Arguments.map(arg => expressionToString(arg)).join(", ");
    return `${expressionToString(expr.Function)}(${args})`;
  }
  if (expr instanceof ArrayLiteral) {
    const elements = expr.Elements.map(el => expressionToString(el)).join(", ");
    return `[${elements}]`;
  }
  if (expr && "Left" in expr && "Index" in expr) {
    return `(${expressionToString((expr as IndexExpression).Left)}[${expressionToString((expr as any).Index)}])`;
  }
  return "";
}
