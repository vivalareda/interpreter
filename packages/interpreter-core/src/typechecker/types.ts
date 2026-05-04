export type Type =
  | { tag: "Int" }
  | { tag: "Bool" }
  | { tag: "String" }
  | { tag: "Null" }
  | { tag: "Any" }
  | { tag: "TypeVar"; name: string }
  | { tag: "Array"; elementType: Type }
  | { tag: "Function"; paramTypes: Type[]; returnType: Type };

export const T_INT: Type = { tag: "Int" };
export const T_BOOL: Type = { tag: "Bool" };
export const T_STRING: Type = { tag: "String" };
export const T_NULL: Type = { tag: "Null" };

export const BUILTINS = [
  "GAROCHE MOI CA",
  "CEST LONG COMMENT",
  "BOUTE DU BOUTE",
] as const;

export const BUILTIN_TYPES: Record<
  Exclude<(typeof BUILTINS)[number], "BOUTE DU BOUTE">,
  Type
> = {
  "GAROCHE MOI CA": { tag: "Function", paramTypes: [], returnType: T_NULL },
  "CEST LONG COMMENT": {
    tag: "Function",
    paramTypes: [
      {
        tag: "Array",
        elementType: {
          tag: "Any",
        },
      },
      { tag: "String" },
    ],
    returnType: T_INT,
  },
};
