import type { Lexer } from "../lexer/lexer";
import { TOKENS, type Token, type TokenType } from "../lexer/token";
import {
  type Expression,
  ExpressionStatement,
  ReturnStatement,
} from "./ast";
import { LetStatement } from "./nodes/LetStatement";
import { Identifier, PrefixExpression, Program } from "./ast";
import { ArrayLiteral } from "./nodes/ArrayLiteral";
import { BooleanLiteral } from "./nodes/BooleanExpression";
import { FunctionCallExpression } from "./nodes/CallExpression";
import { FunctionLiteral } from "./nodes/FunctionLiteral";
import { BlockStatement, IfExpression } from "./nodes/IfExpression";
import { IndexExpression } from "./nodes/IndexExpression";
import { InfixExpression } from "./nodes/InfixExpression";
import { IntegerLiteral } from "./nodes/IntegerLiteral";
import { StringLiteral } from "./nodes/StringLiteral";

export type PrefixParseFn = () => Expression;
export type InfixParseFns = (exp: Expression) => Expression;

const PRECEDENCE = {
  LOWEST: 1,
  EQUALS: 2,
  LESSGREATER: 3,
  SUM: 4,
  PRODUCT: 5,
  PREFIX: 6,
  CALL: 7,
  INDEX: 8,
} as const;

type PRECEDENCES = (typeof PRECEDENCE)[keyof typeof PRECEDENCE];

const precedenceMap: Map<string, PRECEDENCES> = new Map([
  [TOKENS.LPAREN, PRECEDENCE.CALL],
  [TOKENS.EQ, PRECEDENCE.EQUALS],
  [TOKENS.NEQ, PRECEDENCE.EQUALS],
  [TOKENS.LT, PRECEDENCE.LESSGREATER],
  [TOKENS.GT, PRECEDENCE.LESSGREATER],
  [TOKENS.PLUS, PRECEDENCE.SUM],
  [TOKENS.MINUS, PRECEDENCE.SUM],
  [TOKENS.SLASH, PRECEDENCE.PRODUCT],
  [TOKENS.ASTERISK, PRECEDENCE.PRODUCT],
  [TOKENS.LBRACKET, PRECEDENCE.INDEX],
]);

export type ParseError = {
  message: string;
  token: Token;
};

export class Parser {
  currToken: Token;
  peekToken: Token;
  errors: ParseError[] = [];
  prefixParseFn: Map<TokenType, PrefixParseFn> = new Map();
  infixParseFn: Map<TokenType, InfixParseFns> = new Map();

  constructor(public lexer: Lexer) {
    this.lexer = lexer;
    this.registerFnMaps();

    this.nextToken();
    this.nextToken();
  }

  registerFnMaps() {
    this.registerPrefixFn(TOKENS.IDENT, this.parseIdentifier.bind(this));
    this.registerPrefixFn(TOKENS.INT, this.parseIntegerExpression.bind(this));
    this.registerPrefixFn(TOKENS.STRING, this.parseStringLiteral.bind(this));
    this.registerPrefixFn(TOKENS.LBRACKET, this.parseArrayLiteral.bind(this));

    this.registerPrefixFn(
      TOKENS.LPAREN,
      this.parseGroupedExpression.bind(this),
    );

    this.registerPrefixFn(TOKENS.TRUE, this.parseBoolean.bind(this));
    this.registerPrefixFn(TOKENS.FALSE, this.parseBoolean.bind(this));

    this.registerPrefixFn(TOKENS.BANG, this.parsePrefixExpression.bind(this));
    this.registerPrefixFn(TOKENS.MINUS, this.parsePrefixExpression.bind(this));

    this.registerPrefixFn(TOKENS.IF, this.parseIfExpression.bind(this));
    this.registerPrefixFn(
      TOKENS.FNSTART,
      this.parseFunctionExpression.bind(this),
    );

    this.registerInfixFn(
      TOKENS.LPAREN,
      this.parseFunctionCallExpression.bind(this),
    );

    this.registerInfixFn(TOKENS.LBRACKET, this.parseIndexExpression.bind(this));
    this.registerInfixFn(TOKENS.PLUS, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.MINUS, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.ASTERISK, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.SLASH, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.GT, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.LT, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.EQ, this.parseInfixExpression.bind(this));
    this.registerInfixFn(TOKENS.NEQ, this.parseInfixExpression.bind(this));
  }

  registerPrefixFn(type: TokenType, fn: PrefixParseFn) {
    this.prefixParseFn.set(type, fn);
  }

  registerInfixFn(type: TokenType, fn: InfixParseFns) {
    this.infixParseFn.set(type, fn);
  }

  expectPeekAndAdvance(expected: string) {
    if (this.peekToken.Type !== expected) {
      this.peekError(expected);
      return false;
    }
    this.nextToken();
    return true;
  }

  peekError(expectedType: string) {
    const expected =
      expectedType === "IDENT" ? "une variable" : `"${expectedType}"`;

    const actual =
      this.peekToken.Type === "IDENT"
        ? "une variable"
        : `"${this.peekToken.Type}"`;

    const errors = [
      `Es tu sur que c'est ${actual} qui va la? j'pense que ${expected} fait plus de sense t'en pense quoi mon pite!`,
      `Hein?? ${actual}?? C'est ${expected} que ça prend mon chum, réveille`,
      `T'as mis un ${actual} mais j'veux ${expected}... c'est-tu si compliqué que ça osti`,
      `tu dors au gaz, ${actual} a la place de ${expected}`,
    ];
    this.errors.push({
      message: errors[Math.floor(Math.random() * errors.length)],
      token: this.peekToken,
    });
  }

  parseStringLiteral() {
    return new StringLiteral(this.currToken, this.currToken.Literal);
  }

  parseArrayLiteral() {
    const token = this.currToken;
    const elements: Expression[] = this.parseExpressionList(TOKENS.RBRACKET);

    return new ArrayLiteral(token, elements);
  }

  parseIndexExpression(left: Expression) {
    const token = this.currToken;

    this.nextToken();

    const index = this.parseExpression(PRECEDENCE.LOWEST);

    if (!this.expectPeekAndAdvance(TOKENS.RBRACKET)) {
      return;
    }

    return new IndexExpression(token, left, index);
  }

  parseExpressionList(endToken: string) {
    const elements: Expression[] = [];

    if (this.peekTokenIs(endToken)) {
      this.nextToken();
      return elements;
    }

    this.nextToken();
    elements.push(this.parseExpression(PRECEDENCE.LOWEST));

    while (this.peekTokenIs(TOKENS.COMMA)) {
      this.nextToken();
      this.nextToken();
      elements.push(this.parseExpression(PRECEDENCE.LOWEST));
    }

    if (!this.expectPeekAndAdvance(endToken)) {
      return;
    }

    return elements;
  }

  parseGroupedExpression() {
    this.nextToken();

    const exp = this.parseExpression(PRECEDENCE.LOWEST);

    if (!this.expectPeekAndAdvance(TOKENS.RPAREN)) {
      return null;
    }

    return exp;
  }

  parseIfExpression() {
    const token = this.currToken;

    if (!this.expectPeekAndAdvance(TOKENS.LPAREN)) {
      return;
    }

    this.nextToken();

    const condition = this.parseExpression(PRECEDENCE.LOWEST);

    if (!this.expectPeekAndAdvance(TOKENS.RPAREN)) {
      return;
    }

    if (!this.expectPeekAndAdvance(TOKENS.LBRACE)) {
      return;
    }

    const consequence = this.parseBlockStatement(TOKENS.RBRACE);

    if (this.peekTokenIs(TOKENS.ELSE)) {
      this.nextToken();

      if (!this.expectPeekAndAdvance(TOKENS.LBRACE)) {
        return;
      }

      const alternative = this.parseBlockStatement(TOKENS.RBRACE);

      return new IfExpression(token, condition, consequence, alternative);
    }

    return new IfExpression(token, condition, consequence);
  }

  parseFunctionParams() {
    let params: Identifier[] = [];

    while (this.peekTokenIs(TOKENS.COMMA) || this.peekTokenIs(TOKENS.RPAREN)) {
      const ident = new Identifier(this.currToken, this.currToken.Literal);
      params.push(ident);

      if (this.peekTokenIs(TOKENS.RPAREN)) {
        this.nextToken();
        return params;
      }

      this.nextToken();
      this.nextToken();
    }

    return params;
  }

  parseFunctionExpression() {
    const token = this.currToken;

    if (!this.expectPeekAndAdvance(TOKENS.LPAREN)) {
      return;
    }

    this.nextToken();
    const params = this.parseFunctionParams();

    const body = this.parseBlockStatement(TOKENS.FNEND);

    return new FunctionLiteral(token, params, body);
  }

  parseFunctionCallExpression(func: Expression) {
    const args = this.parseExpressionList(TOKENS.RPAREN);
    return new FunctionCallExpression(this.currToken, func, args);
  }

  parseBlockStatement(expectedEndToken: string = TOKENS.EOF) {
    const openingToken = this.currToken;
    const blockStatement = new BlockStatement(this.currToken);

    this.nextToken();

    while (
      !this.currTokenIs(expectedEndToken) &&
      !this.currTokenIs(TOKENS.EOF)
    ) {
      const stmt = this.parseStatement();
      if (stmt) {
        blockStatement.statements.push(stmt);
      }
      this.nextToken();
    }

    if (expectedEndToken !== TOKENS.EOF && this.currTokenIs(TOKENS.EOF)) {
      this.errors.push({
        message: `Tu as oublié de fermer ton bloc le zouf!`,
        token: openingToken,
      });
    }

    return blockStatement;
  }

  parseInfixExpression(leftExp: Expression) {
    const token = this.currToken;
    const precedence = this.currPrecedence();

    this.nextToken();
    const rightExp = this.parseExpression(precedence);

    return new InfixExpression(token, leftExp, token.Literal, rightExp);
  }

  parseIntegerExpression() {
    return new IntegerLiteral(
      this.currToken,
      Number.parseInt(this.currToken.Literal, 10),
    );
  }

  parseBoolean() {
    return new BooleanLiteral(this.currToken, this.currTokenIs(TOKENS.TRUE));
  }

  parsePrefixExpression() {
    const token = this.currToken;

    this.nextToken();

    const expr = this.parseExpression(PRECEDENCE.PREFIX);

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new PrefixExpression(token, token.Literal, expr);
  }

  parseIdentifier() {
    return new Identifier(this.currToken, this.currToken.Literal);
  }

  parseStatement() {
    switch (this.currToken.Type) {
      case "MET MOI CA ICITTE":
        return this.parseDeclaration();
      case "TOKEBEC":
        return this.parseReturn();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseExpression(precedence: PRECEDENCES) {
    const prefix = this.prefixParseFn.get(this.currToken.Type);
    if (!prefix) {
      return;
    }

    let leftExp = prefix();

    while (
      this.peekPrecedence() > precedence &&
      !this.peekTokenIs(TOKENS.SEMICOLON)
    ) {
      const infix = this.infixParseFn.get(this.peekToken.Type);
      if (!infix) {
        return leftExp;
      }

      this.nextToken();
      leftExp = infix(leftExp);
    }

    return leftExp;
  }

  peekPrecedence() {
    if (this.peekToken && precedenceMap.has(this.peekToken.Type)) {
      return precedenceMap.get(this.peekToken.Type);
    }

    return PRECEDENCE.LOWEST;
  }

  currPrecedence() {
    if (this.currToken && precedenceMap.has(this.currToken.Type)) {
      return precedenceMap.get(this.currToken.Type);
    }

    return PRECEDENCE.LOWEST;
  }

  parseExpressionStatement() {
    const token = this.currToken;

    const stmt = this.parseExpression(PRECEDENCE.LOWEST);

    if (!stmt) {
      return null;
    }

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new ExpressionStatement(token, stmt);
  }

  parseReturn() {
    const returnToken = this.currToken;

    this.nextToken();

    const value = this.parseExpression(PRECEDENCE.LOWEST);

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new ReturnStatement(returnToken, value);
  }

  parseDeclaration() {
    const declarationToken = this.currToken;

    if (!this.expectPeekAndAdvance(TOKENS.IDENT)) {
      return null;
    }

    const ident = new Identifier(this.currToken, this.currToken.Literal);

    if (!this.expectPeekAndAdvance(TOKENS.ASSIGN)) {
      return null;
    }

    this.nextToken();

    const value = this.parseExpression(PRECEDENCE.LOWEST);

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken();
    }

    return new LetStatement(declarationToken, ident, value);
  }

  currTokenIs(tokenType: string) {
    return this.currToken.Type === tokenType;
  }

  peekTokenIs(tokenType: string) {
    return this.peekToken.Type === tokenType;
  }

  nextToken() {
    this.currToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram() {
    const program = new Program();

    while (this.currToken.Type !== TOKENS.EOF) {
      if (this.currTokenIs(TOKENS.COMMENT)) {
        this.nextToken();
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) {
        program.statements.push(stmt);
      }
      this.nextToken();
    }

    return program;
  }
}