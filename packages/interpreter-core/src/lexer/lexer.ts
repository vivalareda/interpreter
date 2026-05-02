import type { Token } from "./token";
import { TOKENS } from "./token";

export class Lexer {
  private currPosition: number;
  private nextPosition: number;
  private currChar: string | null;
  private line: number;
  private column: number;

  constructor(public input: string) {
    this.currPosition = 0;
    this.nextPosition = 0;
    this.currChar = null;
    this.line = 1;
    this.column = 0;

    this.readChar();
  }

  nextToken() {
    this.skipWhitespace();

    const line = this.line;
    const column = this.column;
    let token: Token;

    switch (this.currChar) {
      case "=":
        if (this.peek() === "=") {
          const literal = this.input[this.currPosition];
          this.readChar();
          token = {
            Type: TOKENS.EQ,
            Literal: literal + this.currChar,
            Line: line,
            Column: column,
          };
        } else {
          token = {
            Type: TOKENS.ASSIGN,
            Literal: this.currChar,
            Line: line,
            Column: column,
          };
        }
        break;
      case "!":
        if (this.peek() === "=") {
          const literal = this.input[this.currPosition];
          this.readChar();
          token = {
            Type: TOKENS.NEQ,
            Literal: literal + this.currChar,
            Line: line,
            Column: column,
          };
        } else {
          token = {
            Type: TOKENS.BANG,
            Literal: this.currChar,
            Line: line,
            Column: column,
          };
        }
        break;
      case '"': {
        const value = this.readString();
        token = {
          Type: TOKENS.STRING,
          Literal: value,
          Line: line,
          Column: column,
        };
        break;
      }
      case ":":
        token = {
          Type: TOKENS.COLON,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "[":
        token = {
          Type: TOKENS.LBRACKET,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "]":
        token = {
          Type: TOKENS.RBRACKET,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "<":
        token = {
          Type: TOKENS.LT,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ">":
        token = {
          Type: TOKENS.GT,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "(":
        token = {
          Type: TOKENS.LPAREN,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ")":
        token = {
          Type: TOKENS.RPAREN,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "{":
        token = {
          Type: TOKENS.LBRACE,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "}":
        token = {
          Type: TOKENS.RBRACE,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ",":
        token = {
          Type: TOKENS.COMMA,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case ";":
        token = {
          Type: TOKENS.SEMICOLON,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "/":
        token = {
          Type: TOKENS.SLASH,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "*":
        token = {
          Type: TOKENS.ASTERISK,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "+":
        token = {
          Type: TOKENS.PLUS,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case "-":
        token = {
          Type: TOKENS.MINUS,
          Literal: this.currChar,
          Line: line,
          Column: column,
        };
        break;
      case null:
        token = { Type: TOKENS.EOF, Literal: "", Line: line, Column: column };
        break;
      default:
        if (this.isLetter(this.currChar)) {
          const literal = this.readIdentifier();
          const type = this.identifierType(literal);
          token = {
            Type: type,
            Literal: literal,
            Line: line,
            Column: column,
          };
          return token;
        } else if (this.isDigit(this.currChar)) {
          const literal = this.readNumber();
          token = {
            Type: TOKENS.INT,
            Literal: literal,
            Line: line,
            Column: column,
          };
          return token;
        } else {
          token = {
            Type: TOKENS.ILLEGAL,
            Literal: this.currChar,
            Line: line,
            Column: column,
          };
        }
    }

    this.readChar();

    return token;
  }

  skipUntilNewline() {
    while (this.currChar !== null && this.currChar !== "\n") {
      this.readChar();
    }
  }

  peek() {
    if (this.currPosition >= this.input.length) {
      return "";
    }

    const peekChar = this.input[this.nextPosition];
    if (!peekChar) throw new Error("tried to peek next char but got nothing");

    return peekChar;
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
    let startingPosition = this.currPosition;
    while (this.isLetter(this.currChar)) {
      this.readChar();
    }
    const ident = this.input.slice(startingPosition, this.currPosition);
    if (ident === "TYL") {
      this.skipUntilNewline();
      return ident;
    }
    if (ident === "AMETON") {
      const nextWord = this.readNextWord();
      if (nextWord === "") return ident;
      if (nextWord === "QUE") {
        return `${ident} ${nextWord}`;
      }
    } else if (ident === "MET") {
      let value = ident;
      while (value !== "MET MOI CA ICITTE") {
        const nextWord = this.readNextWord();
        if (nextWord === "") return value;
        value += ` ${nextWord}`;
      }
      return value;
    } else if (ident === "JAI") {
      let value = ident;
      while (value !== "JAI JAMAIS TOUCHER A MES FILLES") {
        const nextWord = this.readNextWord();
        if (nextWord === "") return value;
        value += ` ${nextWord}`;
      }
      return value;
    } else if (ident === "SAUF") {
      let value = ident;
      while (value !== "SAUF UNE FOIS AU CHALET") {
        const nextWord = this.readNextWord();
        if (nextWord === "") return value;
        value += ` ${nextWord}`;
      }
      return value;
    } else if (ident === "SINON") {
      let value = ident;
      while (value !== "SINON LA") {
        const nextWord = this.readNextWord();
        if (nextWord === "") return value;
        value += ` ${nextWord}`;
      }
      return value;
    } else if (ident === "GAROCHE") {
      let value = ident;
      while (value !== "GAROCHE MOI CA") {
        const nextWord = this.readNextWord();
        if (nextWord === "") return value;
        value += ` ${nextWord}`;
      }
      return value;
    } else if (ident === "CEST") {
      let value = ident;
      while (value !== "CEST LONG COMMENT") {
        const nextWord = this.readNextWord();
        if (nextWord === "") return value;
        value += ` ${nextWord}`;
      }
      return value;
    }

    return ident;
  }

  readNumber() {
    let startingPosition = this.currPosition;
    while (this.isDigit(this.currChar)) {
      this.readChar();
    }
    return this.input.slice(startingPosition, this.currPosition);
  }

  readNextWord() {
    this.skipWhitespace();
    const startingPosition = this.currPosition;
    while (this.isLetter(this.currChar)) {
      this.readChar();
    }
    return this.input.slice(startingPosition, this.currPosition);
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
      case "TYL":
        return TOKENS.COMMENT;
      case "true":
        return TOKENS.TRUE;
      case "false":
        return TOKENS.FALSE;
      default:
        return TOKENS.IDENT;
    }
  }

  readChar() {
    if (this.nextPosition >= this.input.length) {
      this.currChar = null;
    } else {
      const input = this.input[this.nextPosition];
      if (!input) throw new Error("expected a value but got nothing");
      this.currChar = input;
    }
    this.currPosition = this.nextPosition;
    this.nextPosition++;

    this.updatePosition(this.currChar);
  }

  updatePosition(ch: string | null) {
    if (ch === "\n") {
      this.line++;
      this.column = 0;
    } else if (ch !== null) {
      this.column++;
    }
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