import { describe, expect, test } from "bun:test";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { TypeChecker } from "../typechecker/typechecker";

function typeCheck(input: string) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const typeChecker = new TypeChecker();
  typeChecker.check(program);
  return typeChecker;
}

function expectTypeError(input: string) {
  const tc = typeCheck(input);
  expect(tc.errors.length).toBeGreaterThan(0);
}

function expectNoTypeError(input: string) {
  const tc = typeCheck(input);
  if (tc.errors.length > 0) {
    console.log(tc.errors);
  }
  expect(tc.errors.length).toBe(0);
}

describe("typechecker", () => {
  describe("literals", () => {
    test("integer literal", () =>
      expectNoTypeError("MET MOI CA ICITTE x = 5;"));

    test("boolean literal", () =>
      expectNoTypeError("MET MOI CA ICITTE x = true;"));

    test("string literal", () =>
      expectNoTypeError(`MET MOI CA ICITTE x = "hello";`));
  });

  describe("infix expressions", () => {
    test("int + int", () => expectNoTypeError("MET MOI CA ICITTE x = 5 + 3;"));

    test("string + string", () =>
      expectNoTypeError(`MET MOI CA ICITTE x = "a" + "b";`));

    test("int - int", () => expectNoTypeError("MET MOI CA ICITTE x = 5 - 3;"));

    test("int * int", () => expectNoTypeError("MET MOI CA ICITTE x = 5 * 3;"));

    test("int / int", () => expectNoTypeError("MET MOI CA ICITTE x = 5 / 3;"));

    test("int > int", () => expectNoTypeError("MET MOI CA ICITTE x = 5 > 3;"));

    test("int < int", () => expectNoTypeError("MET MOI CA ICITTE x = 5 < 3;"));

    test("int == int", () =>
      expectNoTypeError("MET MOI CA ICITTE x = 5 == 3;"));

    test("int != int", () =>
      expectNoTypeError("MET MOI CA ICITTE x = 5 != 3;"));

    test("int + bool throws", () =>
      expectTypeError("MET MOI CA ICITTE x = 5 + true;"));

    test("int + string throws", () =>
      expectTypeError(`MET MOI CA ICITTE x = 5 + "hello";`));

    test("string - string throws", () =>
      expectTypeError(`MET MOI CA ICITTE x = "a" - "b";`));

    test("int == bool throws", () =>
      expectTypeError("MET MOI CA ICITTE x = 5 == true;"));
  });

  describe("prefix expressions", () => {
    test("!bool", () => expectNoTypeError("MET MOI CA ICITTE x = !true;"));

    test("-int", () => expectNoTypeError("MET MOI CA ICITTE x = -5;"));

    test("!int throws", () => expectTypeError("MET MOI CA ICITTE x = !5;"));

    test("-bool throws", () => expectTypeError("MET MOI CA ICITTE x = -true;"));
  });

  describe("arrays", () => {
    test("int array", () =>
      expectNoTypeError("MET MOI CA ICITTE x = [1, 2, 3];"));

    test("string array", () =>
      expectNoTypeError(`MET MOI CA ICITTE x = ["a", "b"];`));

    test("mixed array throws", () =>
      expectTypeError(`MET MOI CA ICITTE x = [1, "hello"];`));

    test("array index", () =>
      expectNoTypeError("MET MOI CA ICITTE x = [1, 2, 3][1];"));

    test("index non array throws", () =>
      expectTypeError("MET MOI CA ICITTE x = 5[1];"));
  });

  describe("if expressions", () => {
    test("if with bool condition", () =>
      expectNoTypeError(`
      MET MOI CA ICITTE x = AMETON QUE (true) {
        TOKEBEC 5;
      } SINON LA {
        TOKEBEC 10;
      }
    `));

    test("if with non bool condition throws", () =>
      expectTypeError(`
      MET MOI CA ICITTE x = AMETON QUE (5) {
        TOKEBEC 5;
      } SINON LA {
        TOKEBEC 10;
      }
    `));

    test("if with mismatched branch types throws", () =>
      expectTypeError(`
      MET MOI CA ICITTE x = AMETON QUE (true) {
        TOKEBEC 5;
      } SINON LA {
        TOKEBEC "hello";
      }
    `));
  });

  describe("functions", () => {
    test("valid function", () =>
      expectNoTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Int
        TOKEBEC x + y;
      SAUF UNE FOIS AU CHALET;
    `));

    test("wrong return type throws", () =>
      expectTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Bool
        TOKEBEC x + y;
      SAUF UNE FOIS AU CHALET;
    `));

    test("type error in body throws", () =>
      expectTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Int
        TOKEBEC x + true;
      SAUF UNE FOIS AU CHALET;
    `));
  });

  describe("function calls", () => {
    test("valid function call", () =>
      expectNoTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Int
        TOKEBEC x + y;
      SAUF UNE FOIS AU CHALET;
      MET MOI CA ICITTE result = add(5, 3);
    `));

    test("wrong argument type throws", () =>
      expectTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Int
        TOKEBEC x + y;
      SAUF UNE FOIS AU CHALET;
      MET MOI CA ICITTE result = add(5, true);
    `));

    test("wrong argument count throws", () =>
      expectTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Int
        TOKEBEC x + y;
      SAUF UNE FOIS AU CHALET;
      MET MOI CA ICITTE result = add(5);
    `));

    test("function call expression", () =>
      expectTypeError(`
      MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x: Int, y: Int) -> Int
        TOKEBEC x + y;
      SAUF UNE FOIS AU CHALET;
      add(5);
      `));
  });

  describe("BUILTINS", () => {
    test("BOUTE DU BOUTE", () =>
      expectNoTypeError(`
      MET MOI CA ICITTE arr = [1, 2, 3];
      BOUTE DU BOUTE(arr);
    `));
  });

  describe("generics", () => {
    test("integer generic type", () => {
      const input = `MET MOI CA ICITTE identity = JAI JAMAIS TOUCHER A MES FILLES(x: T) -> T
        TOKEBEC x;
      SAUF UNE FOIS AU CHALET;
      identity(5);`;
      const tc = typeCheck(input);
      expect(tc.errors.length).toBe(0);
    });

    test("generic function called with String is valid", () => {
      const input = `MET MOI CA ICITTE identity = JAI JAMAIS TOUCHER A MES FILLES(x: T) -> T
        TOKEBEC x;
      SAUF UNE FOIS AU CHALET;
      identity("salut")
      `;
      const tc = typeCheck(input);
      expect(tc.errors).toHaveLength(0);
    });

    test("generic function called with mismatched types errors", () => {
      const input = `MET MOI CA ICITTE combine = JAI JAMAIS TOUCHER A MES FILLES(x: T, y: T) -> T
        TOKEBEC x;
      SAUF UNE FOIS AU CHALET;
      combine(1, "oops")
      `;
      const tc = typeCheck(input);
      expect(tc.errors.length).toBeGreaterThan(0);
    });
  });
});
