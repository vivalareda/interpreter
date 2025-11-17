import { type Object, OBJECTS, } from "./object.js";
import { Error } from "./error.js";
import { String } from "./string.js";
import { Integer } from "./integer.js";
import { Array } from "./array.js";
import { OBJ } from "./evaluator.js";

type BuiltinFunction = (...args: Object[]) => any;

const len: BuiltinFunction = (...args: Object[]) => {
  if (args.length !== 1) {
    return new Error(`wrong number of arguments. got=${args.length}, want=1`);
  };

  const arg = args[0];

  switch (arg.Type()) {
    case "ARRAY":
      return new Integer((arg as Array).Elements.length);
    case "STRING":
      return new Integer((arg as String).Value.length);
    default:
      return new Error(`argument to \`len\` not supported, got ${arg.Type()}`)
  }
}

const first: BuiltinFunction = (...args: Object[]) => {
  if (args.length !== 1) {
    return new Error(`wrong number of arguments. got=${args.length}, want=1`);
  };

  if (args[0].Type() !== OBJECTS.ARRAY_OBJ) {
    return new Error(`argument to \`first\` must be ARRAY, got ${args[0].Type()}`)
  }

  const arr = args[0] as Array;
  if (!(arr.Elements.length >= 0)) {
    return OBJ.NULL;
  }

  return arr.Elements[0];
}

const last: BuiltinFunction = (...args: Object[]) => {
  if (args.length !== 1) {
    return new Error(`wrong number of arguments. got=${args.length}, want=1`);
  };

  if (args[0].Type() !== OBJECTS.ARRAY_OBJ) {
    return new Error(`argument to \`last\` must be ARRAY, got ${args[0].Type()}`)
  }

  const arr = args[0] as Array;
  if (!(arr.Elements.length >= 0)) {
    return OBJ.NULL;
  }

  return arr.Elements[arr.Elements.length - 1];
}

const tail: BuiltinFunction = (...args: Object[]) => {
  if (args.length !== 1) {
    return new Error(`wrong number of arguments. got=${args.length}, want=1`);
  };

  if (args[0].Type() !== OBJECTS.ARRAY_OBJ) {
    return new Error(`argument to \`tail\` must be ARRAY, got ${args[0].Type()}`)
  }

  const arr = args[0] as Array;
  if (!(arr.Elements.length >= 1)) {
    return OBJ.NULL;
  }

  return new Array(arr.Elements.slice(1))
}

const push: BuiltinFunction = (...args: Object[]) => {
  if (args.length !== 2) {
    return new Error(`wrong number of arguments. got=${args.length}, want=1`);
  };

  if (args[0].Type() !== OBJECTS.ARRAY_OBJ) {
    return new Error(`argument to \`push\` must be ARRAY, got ${args[0].Type()}`)
  }

  const arr = args[0] as Array;

  return new Array([...arr.Elements, ...args.slice(1, args.length)])
}

const puts: BuiltinFunction = (...args: Object[]) => {
  for (const arg of args) {
    console.log(arg.Inspect());
  }
  return OBJ.NULL;
}

// const map: BuiltinFunction = (...args: Object[]) => {
//   if (args.length !== 1) {
//     return new Error(`wrong number of arguments. got=${args.length}, want=1`);
//   };
//
//   if (args[0].Type() !== OBJECTS.ARRAY_OBJ) {
//     return new Error(`argument to \`last\` must be ARRAY, got ${args[0].Type()}`)
//   }
//
//
//   return arr.Elements[arr.Elements.length - 1];
// }

export class Builtin implements Object {

  constructor(
    public func: (...args: Object[]) => Object,
  ) { };

  Type() {
    return OBJECTS.BUILTIN_OBJ;
  }

  Inspect() {
    return "builtin function";
  }
};

export const BUILTINS: Map<string, Builtin> = new Map([
  ["len", new Builtin(len)],
  ["first", new Builtin(first)],
  ["last", new Builtin(last)],
  ["tail", new Builtin(tail)],
  ["push", new Builtin(push)],
  ["puts", new Builtin(puts)],
]);
