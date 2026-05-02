import { Token } from "../../lexer/token";
import { Array } from "./array";
import { Error } from "./error";
import { Integer } from "./integer";
import { CONSTANT_OBJECTS, OBJECTS, type Object } from "./object";
import { String } from "./string";

type BuiltinFunction = (token: Token, ...args: Object[]) => Object;

const length: BuiltinFunction = (token, ...args) => {
  if (args.length !== 1) {
    return new Error(`d'apres moi t'es chaud big`, token);
  }

  switch (args[0].Type()) {
    case OBJECTS.ARRAY_OBJ: {
      const array = args[0] as Array;
      return new Integer(array.Elements.length);
    }
    case OBJECTS.STRING_OBJ: {
      const str = args[0] as String;
      return new Integer(str.Value.length);
    }
    default: {
      return new Error(
        `d'apres moi t'es chaud big, t'essaie de faire une longueur sur ${args[0].Type()}`,
        token,
      );
    }
  }
};

const last: BuiltinFunction = (token, ...args) => {
  if (args.length !== 1) {
    return new Error(`d'apres moi t'es chaud big`, token);
  }

  switch (args[0].Type()) {
    case OBJECTS.ARRAY_OBJ: {
      const array = args[0] as Array;
      if (array.Elements.length === 0) {
        return CONSTANT_OBJECTS.null;
      }
      return array.Elements[array.Elements.length - 1];
    }
    default: {
      return new Error(
        `d'apres moi t'es chaud big, t'essaie de faire une longueur sur ${args[0].Type()}`,
        token,
      );
    }
  }
};

const print: BuiltinFunction = (_, ...args: Object[]) => {
  for (const arg of args) {
    console.log(arg.Inspect());
  }

  return CONSTANT_OBJECTS.null;
};

export class Builtin implements Object {
  constructor(public func: BuiltinFunction) {}

  Type() {
    return OBJECTS.BUILTIN_OBJ;
  }

  Inspect(): string {
    return "builtin functions";
  }
}

export const BUILTIN_FUCTIONS: Map<string, Builtin> = new Map([
  ["GAROCHE MOI CA", new Builtin(print)],
  ["CEST LONG COMMENT", new Builtin(length)],
  ["BOUTE DU BOUTE", new Builtin(last)],
]);

