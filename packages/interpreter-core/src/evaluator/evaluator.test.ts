import { Lexer } from "../lexer/lexer.js";
import { Array } from "./array.js";
import { String } from "./string.js";
import { Parser } from "../parser/parser.js";
import { describe, test, expect } from "bun:test.js";
import type { Hashable, Object } from "./object.js";
import { Integer } from "./integer.js";
import { Eval } from "./evaluator.js";
import { Boolean } from "./boolean.js";
import { Error } from "./error.js";
import { Environment } from "./environment.js";
import type { Function } from "./function.js";
import { HashLiteral } from "../parser/nodes/HashLiteral.js";
import { Hash } from "./hash.js";

describe("evaluator tests", () => {
  describe("eval integer literal", () => {
    const tests = [
      { input: "5", expected: 5 },
      { input: "10", expected: 10 }
    ];

    for (const testCase of tests) {
      test(`eval integer: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
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
      { input: "1 > 1", expected: false },
      { input: "1 < 1", expected: false },
      { input: "1 == 1", expected: true },
      { input: "1 != 2", expected: true },
      { input: "1 == 2", expected: false },
    ];

    for (const testCase of tests) {
      test(`eval boolean: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  });

  describe("evaluate if expressions", () => {
    const tests = [
      { input: "AMETON QUE (true) { 10 }", expected: 10 },
      { input: "AMETON QUE (false) { 10 }", expected: null },
      { input: "AMETON QUE (1) { 10 }", expected: 10 },
      { input: "AMETON QUE (1 < 2) { 10 }", expected: 10 },
      { input: "AMETON QUE (1 > 2) { 10 } SINON LA { 20 }", expected: 20 },
      { input: "AMETON QUE (1 < 2) { 10 } SINON LA { 20 }", expected: 10 },
    ];

    for (const testCase of tests) {
      test(`if expression: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  });

  describe("evaluate return statements", () => {
    const tests = [
      { input: "TOKEBEC 10", expected: 10 },
      { input: "TOKEBEC 10;9;", expected: 10 },
      { input: "TOKEBEC 2 * 5; 9;", expected: 10 },
      { input: "9; TOKEBEC 2 * 5; 9;", expected: 10 },
      {
        input: `
            AMETON QUE (10 > 1) {
              AMETON QUE (10 > 1) {
                TOKEBEC 10;
              }
            TOKEBEC 1;
          }`,
        expected: 10
      }
    ];

    for (const testCase of tests) {
      test(`return statement: ${testCase.input.slice(0, 40)}...`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  });

  describe("test errors", () => {
    const tests = [
      { input: "5 + true;", expected: "type mismatch: INTEGER + BOOLEAN" },
      { input: "5 + true; 5;", expected: "type mismatch: INTEGER + BOOLEAN" },
      { input: "-true", expected: "unknown operator: -BOOLEAN" },
      { input: "true + false;", expected: "unknown operator: BOOLEAN + BOOLEAN" },
      { input: "5; true + false; 5", expected: "unknown operator: BOOLEAN + BOOLEAN" },
      { input: "AMETON QUE (10 > 1) { true + false }", expected: "unknown operator: BOOLEAN + BOOLEAN" },
      {
        input: `
            AMETON QUE (10 > 1) {
              AMETON QUE (10 > 1) {
                TOKEBEC true + false;
              }
            TOKEBEC 1;
          }`,
        expected: "unknown operator: BOOLEAN + BOOLEAN",
      },
      { input: "foobar;", expected: "Identifier not found: foobar" },
      { input: '"hello" - "world"', expected: "unknown operator: STRING - STRING" },
    ];

    for (const testCase of tests) {
      test(`error: ${testCase.input.slice(0, 40)}...`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  });

  describe("test let statement", () => {
    const tests = [
      { input: "MET MOI CA ICITTE x = 5; x;", expected: 5 },
      { input: "MET MOI CA ICITTE x = 5 * 5; x;", expected: 25 },
      { input: "MET MOI CA ICITTE x = 5; MET MOI CA ICITTE b = x; b;", expected: 5 },
      { input: "MET MOI CA ICITTE a = 5; MET MOI CA ICITTE b = a; MET MOI CA ICITTE c = a + b + 5; c;", expected: 15 },
    ];

    for (const testCase of tests) {
      test(`error: ${testCase.input.slice(0, 40)}`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  })

  describe("test function literals", () => {
    test("function literal", () => {
      const input = `
  JAI JAMAIS TOUCHER A MES FILLES(x)
  x + 2;
  SAUF UNE FOIS AU CHALET;
  `;
      const evaluated = testEval(input);

      expect(evaluated.Type()).toBe("FUNCTION");

      const fn = evaluated as Function;
      expect(fn.Params.length).toBe(1);
      expect(fn.Params[0].Name).toBe("x");
      expect(fn.Body.toString()).toBe("(x + 2)");
    });
  });

  describe("test function application", () => {
    const tests = [
      { input: "MET MOI CA ICITTE identity = JAI JAMAIS TOUCHER A MES FILLES(x) x; SAUF UNE FOIS AU CHALET; identity(5);", expected: 5 },
      { input: "MET MOI CA ICITTE double = JAI JAMAIS TOUCHER A MES FILLES(x) x * 2; SAUF UNE FOIS AU CHALET; double(5);", expected: 10 },
      { input: "MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y) x + y; SAUF UNE FOIS AU CHALET; add(5, 5);", expected: 10 },
      { input: "MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y) x + y; SAUF UNE FOIS AU CHALET; add(5 + 5, add(5, 5));", expected: 20 },
      { input: "JAI JAMAIS TOUCHER A MES FILLES(x) x; SAUF UNE FOIS AU CHALET;(5);", expected: 5 },
    ];

    for (const testCase of tests) {
      test(`function application: ${testCase.input.slice(0, 40)}...`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  });

  describe("test string literal", () => {
    const input = { input: '"Hello world!"', expected: "Hello world!" };

    test('can evaluate string', () => {
      const evaluated = testEval(input.input);
      testObject(evaluated, input.expected)
    })
  })

  describe("test string concatenation", () => {
    const tests = [
      { input: '"hello" + "world"', expected: "helloworld" },
      { input: '"Hello, " + "World!"', expected: "Hello, World!" },
      { input: '"foo" + "bar" + "baz"', expected: "foobarbaz" },
    ];

    for (const testCase of tests) {
      test(`string concatenation: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  });

  describe("test builtin functions", () => {
    const tests = [
      { input: 'len("")', expected: 0 },
      { input: 'len("four")', expected: 4 },
      { input: 'len("hello world")', expected: 11 },
      { input: 'len(1)', expected: "argument to `len` not supported, got INTEGER" },
      { input: 'len("one", "two")', expected: "wrong number of arguments. got=2, want=1" },
    ];

    for (const testCase of tests) {
      test(`builtin function: ${testCase.input}`, () => {
        const evaluated = testEval(testCase.input);
        testObject(evaluated, testCase.expected);
      });
    }
  })

  describe("test array literals", () => {
    const input = "[1, 2 * 2, 3 + 3]";

    const evaluated = testEval(input);
    const res = evaluated as Array

    expect(res).toBeInstanceOf(Array);
    expect(res.Elements.length).toBe(3);
    testObject(res.Elements[0], 1);
    testObject(res.Elements[1], 4);
    testObject(res.Elements[2], 6);
  })

  describe("test array index expressions", () => {
    const tests = [
      { input: "[1, 2, 3][1]", expected: 1 },
      { input: "[1, 2, 3][2]", expected: 2 },
      { input: "[1, 2, 3][3]", expected: 3 },
      { input: "MET MOI CA ICITTE i = 1; [1][i];", expected: 1 },
      { input: "[1, 2, 3][1 + 1 + 1]", expected: 3 },
      { input: "MET MOI CA ICITTE myArray = [1, 2, 3]; myArray[3];", expected: 3 },
      { input: "MET MOI CA ICITTE myArray = [1, 2, 3]; myArray[1] + myArray[2] + myArray[3];", expected: 6 },
      { input: "MET MOI CA ICITTE myArray = [1, 2, 3]; MET MOI CA ICITTE i = myArray[2]; myArray[i];", expected: 2 },
      { input: "[1, 2, 3][5]", expected: null },
      { input: "[1, 2, 3][-1]", expected: null },
    ];

    for (const tt of tests) {
      test(`array index: ${tt.input}`, () => {
        const evaluated = testEval(tt.input);
        testObject(evaluated, tt.expected);
      });
    }
  });

  describe("test built in functions", () => {
    const tests = [
      { input: "first([9,5,8])", expected: 9 },
      { input: "first()", expected: "wrong number of arguments. got=0, want=1" },
      { input: "first(\" \")", expected: "argument to `first` must be ARRAY, got STRING" },

      { input: "last([9,5,8])", expected: 8 },
      { input: "last()", expected: "wrong number of arguments. got=0, want=1" },
      { input: "last(\" \")", expected: "argument to `last` must be ARRAY, got STRING" },

      { input: "tail([9,5,8])", expected: "[5, 8]" },
      { input: "tail()", expected: "wrong number of arguments. got=0, want=1" },
      { input: 'tail("hi")', expected: "argument to `tail` must be ARRAY, got STRING" },

      { input: "push([9,5,8], 0)", expected: "[9, 5, 8, 0]" },
    ];

    for (const tt of tests) {
      const evaluated = testEval(tt.input);
      testObject(evaluated, tt.expected);
    };
  });

  describe("hash tests", () => {
    test("string hash key", () => {
      const hello1 = new String("Hello");
      const hello2 = new String("Hello World");
      const diff1 = new String("My name is Johnny");
      const diff2 = new String("My name is Johnny");

      expect(hello1.HashKey()).not.toBe(hello2.HashKey());
      expect(diff1.HashKey()).toBe(diff2.HashKey());
      expect(hello1.HashKey()).not.toBe(diff1.HashKey());
    });

    test("integer hash key", () => {
      const one1 = new Integer(1);
      const one2 = new Integer(1);
      const two1 = new Integer(2);
      const two2 = new Integer(2);

      expect(one1.HashKey()).toBe(one2.HashKey());
      expect(two1.HashKey()).toBe(two2.HashKey());
      expect(one1.HashKey()).not.toBe(two1.HashKey());
    });

    test("boolean hash key", () => {
      const true1 = new Boolean(true);
      const true2 = new Boolean(true);
      const false1 = new Boolean(false);
      const false2 = new Boolean(false);

      expect(true1.HashKey()).toBe(true2.HashKey());
      expect(false1.HashKey()).toBe(false2.HashKey());
      expect(true1.HashKey()).not.toBe(false1.HashKey());
    });

    test("hash literals", () => {
      const input = `MET MOI CA ICITTE two = "two";
  {
    "one": 10 - 9,
    two: 1 + 1,
    "thr" + "ee": 6 / 2,
    4: 4,
    true: 5,
    false: 6
  }`;

      const evaluated = testEval(input);
      expect(evaluated).toBeInstanceOf(Hash);
      const hash = evaluated as Hash;

      const expected: Record<string, number> = {
        "one": 1,
        "two": 2,
        "three": 3,
        "4": 4,
        "true": 5,
        "false": 6,
      };

      expect(hash.Pairs.length).toBe(Object.keys(expected).length);

      for (const [keyStr, expectedValue] of Object.entries(expected)) {
        const hashKey = keyStr === "true"
          ? new Boolean(true).HashKey()
          : keyStr === "false"
            ? new Boolean(false).HashKey()
            : keyStr === "4"
              ? new Integer(4).HashKey()
              : new String(keyStr).HashKey();

        const pair = hash.Pairs.find(p => (p.key as Hashable).HashKey() === hashKey);

        expect(pair).toBeDefined();
        testObject(pair.value, expectedValue);
      }
    });
  });

  describe("hash index expressions", () => {
    const tests = [
      { input: `{"foo": 5}["foo"]`, expected: 5 },
      { input: `{"foo": 5}["bar"]`, expected: null },
      { input: `MET MOI CA ICITTE key = "foo"; {"foo": 5}[key]`, expected: 5 },
      { input: `{}["foo"]`, expected: null },
      { input: `{5: 5}[5]`, expected: 5 },
      { input: `{true: 5}[true]`, expected: 5 },
      { input: `{false: 5}[false]`, expected: 5 },
    ];

    for (const tt of tests) {
      test(`hash index: ${tt.input}`, () => {
        const evaluated = testEval(tt.input);
        testObject(evaluated, tt.expected);
      });
    }
  });

  describe("hash index expressions - errors", () => {
    const tests = [
      {
        input: `{"name": "Monkey"}[JAI JAMAIS TOUCHER A MES FILLES(x) x SAUF UNE FOIS AU CHALET];`,
        expected: "unusable as hash key: FUNCTION"
      },
      {
        input: `{1: 2}[[1, 2]]`,
        expected: "unusable as hash key: ARRAY"
      },
    ];

    for (const tt of tests) {
      test(`hash error: ${tt.input.slice(0, 50)}...`, () => {
        const evaluated = testEval(tt.input);
        testObject(evaluated, tt.expected);
      });
    }
  });

  describe("hash mixed types", () => {
    test("evaluates mixed type keys and values", () => {
      const input = `MET MOI CA ICITTE x = 5;
      {
        1: "one",
        "two": 2,
        true: [1, 2, 3],
        false: {"nested": "hash"}
      }`;

      const evaluated = testEval(input);
      expect(evaluated.Type()).toBe("HASH");
    });

    test("accesses hash values with expressions as keys", () => {
      const input = `MET MOI CA ICITTE myHash = {5: "five", 10: "ten"};
      myHash[2 + 3]`;

      const evaluated = testEval(input);
      testObject(evaluated, "five");
    });

    test("returns null for missing keys", () => {
      const input = `MET MOI CA ICITTE myHash = {"a": 1, "b": 2};
      myHash["c"]`;

      const evaluated = testEval(input);
      expect(evaluated.Type()).toBe("NULL");
    });

    test("handles empty hash", () => {
      const input = `{}`;

      const evaluated = testEval(input);
      expect(evaluated).toBeInstanceOf(Hash);

      const hash = evaluated as Hash;
      expect(hash.Pairs.length).toBe(0);
    });

    test("handles hash with duplicate keys (last wins)", () => {
      const input = `{"key": 1, "key": 2}`;

      const evaluated = testEval(input);
      expect(evaluated).toBeInstanceOf(Hash);

      const hash = evaluated as Hash;
      const key = new String("key").HashKey();
      console.log(hash.Pairs);

      const pair = hash.Pairs.find(p => p.key.HashKey() === key);

      expect(pair).toBeDefined();
      testObject(pair.value, 2);
    });

    test("evaluates file.txt", () => {
      const input = `
MET MOI CA ICITTE map = JAI JAMAIS TOUCHER A MES FILLES(arr, f)
MET MOI CA ICITTE iter = JAI JAMAIS TOUCHER A MES FILLES(arr, accumulated)
AMETON QUE (len(arr) == 0) {
accumulated
} SINON LA {
iter(tail(arr), push(accumulated, f(first(arr))));
}
SAUF UNE FOIS AU CHALET;
iter(arr, []);
SAUF UNE FOIS AU CHALET;
MET MOI CA ICITTE a = [1, 3, 50, 9];
map(a, JAI JAMAIS TOUCHER A MES FILLES(x) x * 2 SAUF UNE FOIS AU CHALET;);
`;
      const evaluated = testEval(input);
      expect(evaluated.Type()).not.toBe("ERROR");
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

function testObject(obj: Object, expected: any) {
  if (expected === null) {
    expect(obj.Type()).toBe("NULL");
    return;
  }

  if (obj.Type() === "INTEGER") {
    expect(obj).toBeInstanceOf(Integer);
    expect((obj as Integer).Value).toBe(expected);
  } else if (obj.Type() === "BOOLEAN") {
    expect(obj).toBeInstanceOf(Boolean);
    expect((obj as Boolean).Value).toBe(expected);
  } else if (obj.Type() === "STRING") {
    expect(obj).toBeInstanceOf(String);
    expect((obj as String).Value).toBe(expected);
  } else if (obj.Type() === "ARRAY") {
    expect(obj).toBeInstanceOf(Array);
    expect((obj as Array).Inspect()).toBe(expected);
  } else if (obj.Type() === "ERROR") {
    expect(obj).toBeInstanceOf(Error);
    expect((obj as Error).Message).toBe(expected);
  } else if (obj.Type() === "HASH") {
    expect(obj).toBeInstanceOf(HashLiteral);
  } else {
    console.error(`Got unexpected object type: ${obj.Type()}, expected: ${expected}`)
    throw new Error(`Got unexpected object type: ${obj.Type()}, expected: ${expected}`);
  }
}
