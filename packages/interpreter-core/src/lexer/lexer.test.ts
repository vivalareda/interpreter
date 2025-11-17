import { describe, expect, it } from "bun:test.js";
import { Lexer } from "./lexer.js";
import { TOKENS, type TokenType } from "./token.js";

describe("lexer", () => {
  it("should lex symbols correctly", () => {
    const input = "=+(){},:";
    const tests = [
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.PLUS, expectedLiteral: "+" },
      { expectedType: TOKENS.LPAREN, expectedLiteral: "(" },
      { expectedType: TOKENS.RPAREN, expectedLiteral: ")" },
      { expectedType: TOKENS.LBRACE, expectedLiteral: "{" },
      { expectedType: TOKENS.RBRACE, expectedLiteral: "}" },
      { expectedType: TOKENS.COMMA, expectedLiteral: "," },
      { expectedType: TOKENS.COLON, expectedLiteral: ":" },
      { expectedType: TOKENS.EOF, expectedLiteral: "" },
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
      const token = lexer.nextToken();
      expect(token.Type).toBe(test.expectedType as TokenType);
      expect(token.Literal).toBe(test.expectedLiteral);
    }
  });

  it("should lex source code correctly", () => {
    const input = `MET MOI CA ICITTE five = 5;
AMETON QUE (x < y) {
  TOKEBEC true;
} SINON LA {
  TOKEBEC false;
}
MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(a, b)
  TOKEBEC a + b;
SAUF UNE FOIS AU CHALET
!-/*5; 
5 < 10 > 5;
"foobar";
"foo bar";
[1, 2];
`;

    const tests = [
      { expectedType: TOKENS.DECLARATION, expectedLiteral: "MET MOI CA ICITTE" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "five" },
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.IF, expectedLiteral: "AMETON QUE" },
      { expectedType: TOKENS.LPAREN, expectedLiteral: "(" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "x" },
      { expectedType: TOKENS.LT, expectedLiteral: "<" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "y" },
      { expectedType: TOKENS.RPAREN, expectedLiteral: ")" },
      { expectedType: TOKENS.LBRACE, expectedLiteral: "{" },
      { expectedType: TOKENS.RETURN, expectedLiteral: "TOKEBEC" },
      { expectedType: TOKENS.TRUE, expectedLiteral: "true" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.RBRACE, expectedLiteral: "}" },
      { expectedType: TOKENS.ELSE, expectedLiteral: "SINON LA" },
      { expectedType: TOKENS.LBRACE, expectedLiteral: "{" },
      { expectedType: TOKENS.RETURN, expectedLiteral: "TOKEBEC" },
      { expectedType: TOKENS.FALSE, expectedLiteral: "false" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.RBRACE, expectedLiteral: "}" },
      { expectedType: TOKENS.DECLARATION, expectedLiteral: "MET MOI CA ICITTE" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "add" },
      { expectedType: TOKENS.ASSIGN, expectedLiteral: "=" },
      { expectedType: TOKENS.FNSTART, expectedLiteral: "JAI JAMAIS TOUCHER A MES FILLES" },
      { expectedType: TOKENS.LPAREN, expectedLiteral: "(" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "a" },
      { expectedType: TOKENS.COMMA, expectedLiteral: "," },
      { expectedType: TOKENS.IDENT, expectedLiteral: "b" },
      { expectedType: TOKENS.RPAREN, expectedLiteral: ")" },
      { expectedType: TOKENS.RETURN, expectedLiteral: "TOKEBEC" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "a" },
      { expectedType: TOKENS.PLUS, expectedLiteral: "+" },
      { expectedType: TOKENS.IDENT, expectedLiteral: "b" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.FNEND, expectedLiteral: "SAUF UNE FOIS AU CHALET" },
      { expectedType: TOKENS.BANG, expectedLiteral: "!" },
      { expectedType: TOKENS.MINUS, expectedLiteral: "-" },
      { expectedType: TOKENS.SLASH, expectedLiteral: "/" },
      { expectedType: TOKENS.ASTERISK, expectedLiteral: "*" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.LT, expectedLiteral: "<" },
      { expectedType: TOKENS.INT, expectedLiteral: "10" },
      { expectedType: TOKENS.GT, expectedLiteral: ">" },
      { expectedType: TOKENS.INT, expectedLiteral: "5" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.STRING, expectedLiteral: "foobar" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.STRING, expectedLiteral: "foo bar" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.LBRACKET, expectedLiteral: "[" },
      { expectedType: TOKENS.INT, expectedLiteral: "1" },
      { expectedType: TOKENS.COMMA, expectedLiteral: "," },
      { expectedType: TOKENS.INT, expectedLiteral: "2" },
      { expectedType: TOKENS.RBRACKET, expectedLiteral: "]" },
      { expectedType: TOKENS.SEMICOLON, expectedLiteral: ";" },
      { expectedType: TOKENS.EOF, expectedLiteral: "" },
    ];

    const lexer = new Lexer(input);

    for (const test of tests) {
      const token = lexer.nextToken();
      expect(token.Type).toBe(test.expectedType as TokenType);
      expect(token.Literal).toBe(test.expectedLiteral);
    }
  });
});
