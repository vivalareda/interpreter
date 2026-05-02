import { describe, expect, test } from "bun:test";
import { Eval } from "./evaluator";
import { Array } from "./objects/array";
import { Boolean } from "./objects/boolean";
import { Environment } from "./objects/environment";
import { Error as EvalError } from "./objects/error";
import { Integer } from "./objects/integer";
import { type Object } from "./objects/object";
import { String } from "./objects/string";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";

describe("evaluator tests", () => {
  describe("eval integer literal", () => {
    const tests = [
      { input: "5", expected: 5 },
      { input: "10", expected: 10 },
      { input: "-5", expected: -5 },
      { input: "-10", expected: -10 },
      { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
      { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
      { input: "-50 + 100 + -50", expected: 0 },
      { input: "5 * 2 + 10", expected: 20 },
      { input: "5 + 2 * 10", expected: 25 },
      { input: "20 + 2 * -10", expected: 0 },
      { input: "50 / 2 * 2 + 10", expected: 60 },
      { input: "2 * (5 + 10)", expected: 30 },
      { input: "3 * 3 * 3 + 10", expected: 37 },
      { input: "3 * (3 * 3) + 10", expected: 37 },
      { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
    ];

    for (const testCase of tests) {
      test(`eval integer: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("eval boolean literal", () => {
    const tests = [
      { input: "true", expected: true },
      { input: "false", expected: false },
      { input: "!true", expected: false },
      { input: "!false", expected: true },
      { input: "!5", expected: false },
      { input: "!!true", expected: true },
      { input: "!!false", expected: false },
      { input: "!!5", expected: true },
      { input: "1 < 2", expected: true },
      { input: "1 > 2", expected: false },
      { input: "1 < 1", expected: false },
      { input: "1 > 1", expected: false },
      { input: "1 == 1", expected: true },
      { input: "1 != 2", expected: true },
      { input: "1 == 2", expected: false },
      { input: "true == true", expected: true },
      { input: "false == false", expected: true },
      { input: "true == false", expected: false },
      { input: "true != false", expected: true },
      { input: "false != true", expected: true },
      { input: "(1 < 2) == true", expected: true },
      { input: "(1 < 2) == false", expected: false },
      { input: "(1 > 2) == true", expected: false },
      { input: "(1 > 2) == false", expected: true },
    ];

    for (const testCase of tests) {
      test(`eval boolean: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testBooleanObject(evaluated, testCase.expected);
      });
    }
  });

  describe("if else expressions", () => {
    const tests: { input: string; expected: number | null }[] = [
      { input: "AMETON QUE (true) { 10 }", expected: 10 },
      { input: "AMETON QUE (false) { 10 }", expected: null },
      { input: "AMETON QUE (1) { 10 }", expected: 10 },
      { input: "AMETON QUE (1 < 2) { 10 }", expected: 10 },
      { input: "AMETON QUE (1 > 2) { 10 }", expected: null },
      { input: "AMETON QUE (1 > 2) { 10 } SINON LA { 20 }", expected: 20 },
      { input: "AMETON QUE (1 < 2) { 10 } SINON LA { 20 }", expected: 10 },
    ];

    for (const testCase of tests) {
      test(`if else: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        if (testCase.expected !== null) {
          testIntegerObject(evaluated, testCase.expected);
        } else {
          testNullObject(evaluated);
        }
      });
    }
  });

  describe("return statements", () => {
    const tests = [
      { input: "TOKEBEC 10;", expected: 10 },
      { input: "TOKEBEC 10; 9;", expected: 10 },
      { input: "TOKEBEC 2 * 5; 9;", expected: 10 },
      { input: "9; TOKEBEC 2 * 5; 9;", expected: 10 },
    ];

    for (const testCase of tests) {
      test(`return: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("error handling", () => {
    const tests = [
      {
        input: "5 + true;",
        expected:
          "Tu mélanges des affaires qui se mélangent pas mon pite: INTEGER pis BOOLEAN",
      },
      {
        input: "5 + true; 5;",
        expected:
          "Tu mélanges des affaires qui se mélangent pas mon pite: INTEGER pis BOOLEAN",
      },
      {
        input: "-true",
        expected: "C'est quoi stafaire la: -BOOLEAN",
      },
      {
        input: "true + false;",
        expected: "Ca marche pas ton affaire: BOOLEAN + BOOLEAN",
      },
      {
        input: "5; true + false; 5",
        expected: "Ca marche pas ton affaire: BOOLEAN + BOOLEAN",
      },
      {
        input: "foobar",
        expected: "tire toi une buche la faut qu'on parle, foobar existe pas",
      },
      {
        input: '"Hello" - "World"',
        expected: "Ca a pas d'allure ton affaire: STRING - STRING",
      },
    ];

    for (const testCase of tests) {
      test(`error: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        expect(evaluated.Type()).toBe("ERROR");
        expect((evaluated as any).Message).toBe(testCase.expected);
      });
    }
  });

  describe("let statements", () => {
    const tests: { input: string; expected: number }[] = [
      { input: "MET MOI CA ICITTE x = 5; x;", expected: 5 },
      { input: "MET MOI CA ICITTE x = 5 * 5; x;", expected: 25 },
      {
        input: "MET MOI CA ICITTE x = 5; MET MOI CA ICITTE y = x; y;",
        expected: 5,
      },
      {
        input:
          "MET MOI CA ICITTE x = 5; MET MOI CA ICITTE y = x; MET MOI CA ICITTE z = x + y + 5; z;",
        expected: 15,
      },
    ];

    for (const testCase of tests) {
      test(`let: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("function object", () => {
    test("function literal", () => {
      const input =
        "JAI JAMAIS TOUCHER A MES FILLES(x) x + 2; SAUF UNE FOIS AU CHALET";
      const evaluated = testEval(input);
      expect(evaluated.Type()).toBe("FUNCTION");
    });
  });

  describe("function application", () => {
    const tests: { input: string; expected: number }[] = [
      {
        input:
          "MET MOI CA ICITTE identity = JAI JAMAIS TOUCHER A MES FILLES(x) x; SAUF UNE FOIS AU CHALET; identity(5);",
        expected: 5,
      },
      {
        input:
          "MET MOI CA ICITTE identity = JAI JAMAIS TOUCHER A MES FILLES(x) TOKEBEC x; SAUF UNE FOIS AU CHALET; identity(5);",
        expected: 5,
      },
      {
        input:
          "MET MOI CA ICITTE double = JAI JAMAIS TOUCHER A MES FILLES(x) x * 2; SAUF UNE FOIS AU CHALET; double(5);",
        expected: 10,
      },
      {
        input:
          "MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y) x + y; SAUF UNE FOIS AU CHALET; add(5, 5);",
        expected: 10,
      },
      {
        input:
          "JAI JAMAIS TOUCHER A MES FILLES(x) x; SAUF UNE FOIS AU CHALET(5)",
        expected: 5,
      },
    ];

    for (const testCase of tests) {
      test(`call: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testIntegerObject(evaluated, testCase.expected);
      });
    }
  });

  describe("closures", () => {
    test("closure", () => {
      const input = `
        MET MOI CA ICITTE newAdder = JAI JAMAIS TOUCHER A MES FILLES(x) JAI JAMAIS TOUCHER A MES FILLES(y) x + y; SAUF UNE FOIS AU CHALET; SAUF UNE FOIS AU CHALET;
        MET MOI CA ICITTE addTwo = newAdder(2);
        addTwo(2);
      `;
      const evaluated = testEval(input);
      testIntegerObject(evaluated, 4);
    });
  });

  describe("string literal", () => {
    const tests = [
      { input: '"Hello world!";', expected: "Hello world!" },
      { input: '"Hello" + " " + "World!"', expected: "Hello World!" },
    ];

    for (const testCase of tests) {
      test(`string: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testStringObject(evaluated, testCase.expected);
      });
    }
  });

  describe("builtin functions", () => {
    const tests: { input: string; expected: number | string }[] = [
      { input: 'CEST LONG COMMENT("")', expected: 0 },
      { input: 'CEST LONG COMMENT("four")', expected: 4 },
      { input: 'CEST LONG COMMENT("hello world")', expected: 11 },
      {
        input: "CEST LONG COMMENT(1)",
        expected:
          "d'apres moi t'es chaud big, t'essaie de faire une longueur sur INTEGER",
      },
      {
        input: 'CEST LONG COMMENT("one", "two")',
        expected: "d'apres moi t'es chaud big",
      },
    ];

    for (const testCase of tests) {
      test(`builtin: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        if (typeof testCase.expected === "number") {
          testIntegerObject(evaluated, testCase.expected);
        } else {
          expect(evaluated.Type()).toBe("ERROR");
          expect((evaluated as any).Message).toBe(testCase.expected);
        }
      });
    }
  });

  describe("array literal", () => {
    const tests = [
      { input: "[1, 2, 3];", expected: [1, 2, 3] },
      { input: "[1, 2 * 2, 3 + 3];", expected: [1, 4, 6] },
    ];

    for (const testCase of tests) {
      test(`array: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testArrayObject(evaluated, testCase.expected);
      });
    }
  });

  describe("array indexing", () => {
    const tests: { input: string; expected: number | null }[] = [
      { input: "[1, 2, 3][1];", expected: 1 },
      { input: "[1, 2, 3][2];", expected: 2 },
      { input: "[1, 2, 3][3];", expected: 3 },
      { input: "[1, 2, 3][1 + 1];", expected: 2 },
      {
        input: "MET MOI CA ICITTE myArray = [1, 2, 3]; myArray[2];",
        expected: 2,
      },
      {
        input:
          "MET MOI CA ICITTE myArray = [1, 2, 3]; myArray[1] + myArray[2] + myArray[3];",
        expected: 6,
      },
      {
        input:
          "MET MOI CA ICITTE myArray = [1, 2, 3]; MET MOI CA ICITTE i = myArray[2]; myArray[i];",
        expected: 2,
      },
      { input: "[1, 2, 3][4];", expected: null },
      { input: "[1, 2, 3][-1];", expected: null },
    ];

    for (const testCase of tests) {
      test(`array indexing: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);

        if (testCase.expected !== null) {
          testIntegerObject(evaluated, testCase.expected);
        } else {
          testNullObject(evaluated);
        }
      });
    }

    test("array indexing: 0-index error", () => {
      const evaluated = testEval("MET MOI CA ICITTE i = 0; [1][i];");
      expect(evaluated).toBeInstanceOf(EvalError);
      expect((evaluated as EvalError).Message).toBe(
        "Ca marche pas dmeme icitte",
      );
    });
  });
});

function testEval(input: string) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const env = new Environment();

  return Eval(program, env);
}

function testArrayObject(obj: Object, expected: number[]) {
  expect(obj).toBeInstanceOf(Array);
  expect((obj as Array).Elements.map((e) => e.Inspect())).toStrictEqual(
    expected.map((e) => e.toString()),
  );
}

function testIntegerObject(obj: Object, expected: number) {
  expect(obj).toBeInstanceOf(Integer);
  expect((obj as Integer).Value).toBe(expected);
}

function testBooleanObject(obj: Object, expected: boolean) {
  expect(obj).toBeInstanceOf(Boolean);
  expect((obj as Boolean).Value).toBe(expected);
}

function testNullObject(obj: Object) {
  expect(obj.Type()).toBe("NULL");
}

function testStringObject(obj: Object, expected: string) {
  expect(obj).toBeInstanceOf(String);
  expect((obj as String).Value).toBe(expected);
}
