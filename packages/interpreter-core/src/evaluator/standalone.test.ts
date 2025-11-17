import { Lexer } from "../lexer/lexer.js";
import { Error } from "./error.js";
import { Parser } from "../parser/parser.js";
import { describe, test, expect } from "bun:test.js";
import type { Object } from "./object.js";
import { Integer } from "./integer.js";

import { Eval } from "./evaluator.js";
import { Boolean } from "./boolean.js";
import { Environment } from "./environment.js";
import { String } from "./string.js";
import { Array } from "./array.js";

describe("test built in functions", () => {
  const tests = [
    { input: "push([9,5,8], 0)", expected: "[9, 5, 8, 0]" },
  ];

  for (const tt of tests) {
    const evaluated = testEval(tt.input);
    testObject(evaluated, tt.expected);
  };
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
  } else {
    console.error(`Got unexpected object type: ${obj.Type()}, expected: ${expected}`)
    throw new Error(`Got unexpected object type: ${obj.Type()}, expected: ${expected}`);
  }
}
