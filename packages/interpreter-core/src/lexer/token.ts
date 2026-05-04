export type Token = {
  Type: TokenType;
  Literal: string;
  Line: number;
  Column: number;
};

export type TokenType = (typeof TOKENS)[keyof typeof TOKENS];

export const TOKENS = {
  ASSIGN: "=",
  PLUS: "+",
  MINUS: "-",
  BANG: "!",
  ASTERISK: "*",
  SLASH: "/",

  INT: "INT",
  STRING: "STRING",
  DECLARATION: "MET MOI CA ICITTE",
  IDENT: "IDENT",
  IF: "AMETON QUE",
  RETURN: "TOKEBEC",
  TRUE: "true",
  FALSE: "false",
  FNSTART: "JAI JAMAIS TOUCHER A MES FILLES",
  FNEND: "SAUF UNE FOIS AU CHALET",
  ELSE: "SINON LA",

  LT: "<",
  GT: ">",
  EQ: "==",
  NEQ: "!=",
  EOF: "EOF",

  COMMA: ",",
  SEMICOLON: ";",
  LPAREN: "(",
  RPAREN: ")",
  LBRACE: "{",
  RBRACE: "}",
  RBRACKET: "]",
  LBRACKET: "[",
  COLON: ":",
  COMMENT: "TYL",

  TYPE_ARROW: "->",
  TYPE_INT: "Int",
  TYPE_BOOL: "Bool",
  TYPE_STRING: "String",
  TYPE_ARRAY: "Array",
  TYPE_VAR: "T",

  ILLEGAL: "ILLEGAL",
} as const;