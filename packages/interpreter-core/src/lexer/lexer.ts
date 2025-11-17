import type { Token } from "./token.js";
import { TOKENS } from "./token.js";

export class Lexer {
  private currPosition: number;
  private nextPosition: number;
  private currChar: string | null;

  constructor(
    public input: string,
  ) {
    this.currPosition = 0;
    this.nextPosition = 0;
    this.currChar = null;
    this.readChar();
  }

  nextToken() {
    this.skipWhitespace();
    let token: Token

    switch (this.currChar) {
      case "=":
        if (this.peek() === "=") {
          const literal = this.input[this.currPosition];
          this.readChar();
          token = { Type: TOKENS.EQ, Literal: literal + this.currChar };
        } else {
          token = { Type: TOKENS.ASSIGN, Literal: this.currChar };
        }
        break;
      case "!":
        if (this.peek() === "=") {
          const literal = this.input[this.currPosition];
          this.readChar();
          token = { Type: TOKENS.NEQ, Literal: literal + this.currChar };
        } else {
          token = { Type: TOKENS.BANG, Literal: this.currChar };
        }
        break;
      case '"':
        const value = this.readString();
        token = { Type: TOKENS.STRING, Literal: value };
        break;
      case ':':
        token = { Type: TOKENS.COLON, Literal: this.currChar };
        break;
      case "[":
        token = { Type: TOKENS.LBRACKET, Literal: this.currChar };
        break;
      case "]":
        token = { Type: TOKENS.RBRACKET, Literal: this.currChar };
        break;
      case "<":
        token = { Type: TOKENS.LT, Literal: this.currChar };
        break;
      case ">":
        token = { Type: TOKENS.GT, Literal: this.currChar };
        break;
      case "(":
        token = { Type: TOKENS.LPAREN, Literal: this.currChar };
        break;
      case ")":
        token = { Type: TOKENS.RPAREN, Literal: this.currChar };
        break;
      case "{":
        token = { Type: TOKENS.LBRACE, Literal: this.currChar };
        break;
      case "}":
        token = { Type: TOKENS.RBRACE, Literal: this.currChar };
        break;
      case ",":
        token = { Type: TOKENS.COMMA, Literal: this.currChar };
        break;
      case ";":
        token = { Type: TOKENS.SEMICOLON, Literal: this.currChar };
        break;
      case "/":
        token = { Type: TOKENS.SLASH, Literal: this.currChar };
        break;
      case "*":
        token = { Type: TOKENS.ASTERISK, Literal: this.currChar };
        break;
      case "+":
        token = { Type: TOKENS.PLUS, Literal: this.currChar };
        break;
      case "-":
        token = { Type: TOKENS.MINUS, Literal: this.currChar };
        break;
      case "/":
        token = { Type: TOKENS.SLASH, Literal: this.currChar };
        break;
      case null:
        token = { Type: TOKENS.EOF, Literal: "" };
        break;
      default:
        if (this.isLetter(this.currChar)) {
          const literal = this.readIdentifier();
          const type = this.identifierType(literal);
          token = { Type: type, Literal: literal }
          return token;
        } else if (this.isDigit(this.currChar)) {
          const literal = this.readNumber();
          token = { Type: TOKENS.INT, Literal: literal };
          return token;
        } else {
          token = { Type: TOKENS.ILLEGAL, Literal: this.currChar };
        }
    }

    this.readChar();

    return token;
  }

  peek(): string {
    if (this.currPosition >= this.input.length) {
      return "";
    }

    return this.input[this.nextPosition];
  }

  readString() {
    const startingPosition = this.currPosition;
    this.readChar();
    while (this.currChar !== '"' && this.currChar !== null) {
      this.readChar();
    }

    return this.input.slice(startingPosition + 1, this.currPosition);
  }

  readIdentifier() {
    let startingPosition = this.currPosition
    while (this.isLetter(this.currChar)) {
      this.readChar();
    }
    const ident = this.input.slice(startingPosition, this.currPosition);
    if (ident === "AMETON") {
      const nextWord = this.readNextWord();
      if (nextWord === "QUE") {
        return `${ident} ${nextWord}`;
      }
    } else if (ident === "MET") {
      let value = ident;
      while (value !== "MET MOI CA ICITTE") {
        value += ` ${this.readNextWord()}`
      }
      return value;
    } else if (ident === "JAI") {
      let value = ident;
      while (value !== "JAI JAMAIS TOUCHER A MES FILLES") {
        value += ` ${this.readNextWord()}`
      }
      return value;
    } else if (ident === "SAUF") {
      let value = ident;
      while (value !== "SAUF UNE FOIS AU CHALET") {
        value += ` ${this.readNextWord()}`
      }
      return value;
    } else if (ident === "SINON") {
      let value = ident;
      while (value !== "SINON LA") {
        value += ` ${this.readNextWord()}`
      }
      return value;
    }

    return ident
  }

  readNumber() {
    let startingPosition = this.currPosition;
    while (this.isDigit(this.currChar)) {
      this.readChar();
    }
    return this.input.slice(startingPosition, this.currPosition)
  }

  readNextWord() {
    this.skipWhitespace();
    const startingPosition = this.currPosition;
    while (this.isLetter(this.currChar)) {
      this.readChar();
    }
    return this.input.slice(startingPosition, this.currPosition)
  }

  identifierType(ident: string) {
    switch (ident) {
      case "MET MOI CA ICITTE":
        return TOKENS.DECLARATION;
      case "JAI JAMAIS TOUCHER A MES FILLES":
        return TOKENS.FNSTART;
      case "SAUF UNE FOIS AU CHALET":
        return TOKENS.FNEND;
      case "AMETON QUE":
        return TOKENS.IF;
      case "TOKEBEC":
        return TOKENS.RETURN;
      case "SINON LA":
        return TOKENS.ELSE;
      case "true":
        return TOKENS.TRUE;
      case "false":
        return TOKENS.FALSE;
      default:
        return TOKENS.IDENT;
    };
  }

  readChar() {
    if (this.nextPosition >= this.input.length) {
      this.currChar = null;
    } else {
      this.currChar = this.input[this.nextPosition];
    }
    this.currPosition = this.nextPosition;
    this.nextPosition++;
  }

  isLetter(ch: string | null): boolean {
    if (ch === null) return false;
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  isDigit(ch: string | null): boolean {
    if (ch === null) return false;
    return ch >= "0" && ch <= "9";
  }

  skipWhitespace() {
    while (
      this.currChar === " " ||
      this.currChar === "\t" ||
      this.currChar === "\n" ||
      this.currChar === "\r"
    ) {
      this.readChar();
    }
  }
}
