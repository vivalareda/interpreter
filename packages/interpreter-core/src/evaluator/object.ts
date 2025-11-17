export type ObjectType = string;

export interface Object {
  Type(): typeof OBJECTS[keyof typeof OBJECTS]
  Inspect(): string;
  toString?(): string;
}

export type Hashable = Object & {
  HashKey: () => string;
}

export const OBJECTS = {
  INTEGER_OBJ: "INTEGER",
  BOOLEAN_OBJ: "BOOLEAN",
  NULL_OBJ: "NULL",
  RETURN_VALUE_OBJ: "RETURN_VALUE",
  ERROR_OBJ: "ERROR",
  FUNCTION_OBJ: "FUNCTION",
  STRING_OBJ: "STRING",
  BUILTIN_OBJ: "BUILTIN",
  ARRAY_OBJ: "ARRAY",
  HASH_OBJ: "HASH",
} as const;

export class ReturnValue implements Object {
  constructor(
    public Value: Object,
  ) { };

  Inspect() {
    return this.Value.toString();
  }

  Type() {
    return OBJECTS.RETURN_VALUE_OBJ;
  }

  toString() {
    return `${this.Value.toString()}`
  }
}
