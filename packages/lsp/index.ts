import {
  Environment,
  Eval,
  InterpreterError as EvaluatorError,
  Lexer,
  Parser,
  type Token,
  type Type,
  TypeChecker,
} from "@repo/interpreter-core";
import { appendFileSync } from "fs";
import type {
  Diagnostic,
  Message,
  NotificationTextDocumentDidChange,
  NotificationTextDocumentDidOpen,
  RequestTextDocumentHover,
  SplitReturn,
  State,
} from "./types";

const state: State = {
  documents: new Map<string, string>(),
  versions: new Map<string, number>(),
};

const registeredNurse = "\r\n\r\n";
const gazLightingMode = true;

function encodeMessage(rawMsg: unknown): string {
  const msg = JSON.stringify(rawMsg);

  return `Content-Length: ${new TextEncoder().encode(msg).byteLength}${registeredNurse}${msg}`;
}

function messageSplit(msg: string): SplitReturn | null {
  const separatorIndex = msg.indexOf(registeredNurse);
  if (separatorIndex === -1) return null;

  const header = msg.slice(0, separatorIndex);
  const content = msg.slice(separatorIndex + 4);

  const contentLength = parseInt(header.slice("Content-Length: ".length));
  if (Number.isNaN(contentLength)) return null;

  if (content.length < contentLength) return null;

  const advance = header.length + 4 + contentLength;
  const msgContent = content.slice(0, contentLength);

  return {
    advance,
    content: msgContent,
  };
}

function decodeMessage(content: string) {
  const msg: Message = JSON.parse(content);
  return msg.method;
}

let buffer = "";
let validateTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 250;

function log(...args: unknown[]) {
  appendFileSync("/tmp/qc-lsp.log", args.join(" ") + "\n");
}

process.stdin.on("data", (chunk: Buffer) => {
  try {
    buffer += chunk.toString();
    while (true) {
      const result = messageSplit(buffer);
      if (!result) break;
      buffer = buffer.slice(result.advance);
      const method = decodeMessage(result.content);

      switch (method) {
        case "initialize": {
          const message = JSON.parse(result.content) as Message;
          writeResponse({
            id: message.id,
            result: {
              capabilities: {
                textDocumentSync: {
                  openClose: true,
                  change: 1,
                },
                hoverProvider: true,
              },
              serverInfo: {
                name: "qc-lsp",
                version: "v0.0.1",
              },
            },
          });
          break;
        }

        case "textDocument/didChange": {
          const message = JSON.parse(
            result.content,
          ) as NotificationTextDocumentDidChange;
          const changes = message.params.contentChanges[0];
          if (!changes) break;
          state.documents.set(message.params.textDocument.uri, changes.text);
          const version = message.params.textDocument.version;
          if (typeof version === "number") {
            state.versions.set(message.params.textDocument.uri, version);
          }
          debouncedValidate(message.params.textDocument.uri, version);
          break;
        }

        case "initialized": {
          log("client initialized");
          break;
        }

        case "textDocument/didOpen": {
          const message = JSON.parse(
            result.content,
          ) as NotificationTextDocumentDidOpen;
          state.documents.set(
            message.params.textDocument.uri,
            message.params.textDocument.text,
          );
          state.versions.set(
            message.params.textDocument.uri,
            message.params.textDocument.version ?? 0,
          );
          debouncedValidate(
            message.params.textDocument.uri,
            message.params.textDocument.version,
          );
          break;
        }

        case "textDocument/hover": {
          const message = JSON.parse(
            result.content,
          ) as RequestTextDocumentHover;

          const hover = getHover(
            message.params.textDocument.uri,
            message.params.position,
          );

          writeResponse({
            jsonrpc: "2.0",
            id: message.id,
            result: hover,
          });
          break;
        }
      }
      //log(result.content);
    }
  } catch (e) {
    log("error:", e);
  }
});

function getHover(uri: string, position: { line: number; character: number }) {
  const text = state.documents.get(uri);
  if (!text) return null;

  const word = wordAtPosition(text, position);
  if (!word) return null;

  const lexer = new Lexer(text);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();

  if (parser.errors.length > 0) return null;

  const typeChecker = new TypeChecker();
  typeChecker.check(program);

  const type = typeChecker.getType(word);
  if (!type) return null;

  return {
    contents: {
      kind: "markdown",
      value: `\`${word}\`: **${formatType(type)}**`,
    },
  };
}

function formatType(type: Type): string {
  switch (type.tag) {
    case "Array":
      return `${formatType(type.elementType)}[]`;

    case "Function":
      return `(${type.paramTypes.map(formatType).join(", ")}) -> ${formatType(type.returnType)}`;

    default:
      return type.tag;
  }
}

function wordAtPosition(
  text: string,
  position: { line: number; character: number },
): string | null {
  const lines = text.split(/\r?\n/);
  const line = lines[position.line];
  if (line === undefined) return null;

  let start = position.character;
  while (start > 0 && /[A-Za-z0-9_]/.test(line.charAt(start - 1))) {
    start--;
  }

  let end = position.character;
  while (end < line.length && /[A-Za-z0-9_]/.test(line.charAt(end))) {
    end++;
  }

  if (start === end) return null;

  return line.slice(start, end);
}

function writeResponse(msg: unknown) {
  const encoded = encodeMessage(msg);
  process.stdout.write(encoded);
}

function debouncedValidate(uri: string, version?: number) {
  if (validateTimer) clearTimeout(validateTimer);
  validateTimer = setTimeout(() => {
    validate(uri, version);
    validateTimer = null;
  }, DEBOUNCE_MS);
}

function validate(uri: string, version?: number) {
  const text = state.documents.get(uri);
  if (!text) return;

  const lexer = new Lexer(text);
  const parser = new Parser(lexer);
  const program = parser.parseProgram();

  const diagnostics = parser.errors.map((err) => ({
    range: tokenToRange(err.token),
    severity: 1,
    message: err.message,
  }));

  const warnings = parser.warnings.map((w) => ({
    range: tokenToRange(w.token),
    severity: 2,
    message: w.message,
  }));

  if (parser.errors.length === 0) {
    const typeChecker = new TypeChecker();
    typeChecker.check(program);
    for (const err of typeChecker.errors) {
      diagnostics.push({
        range: tokenToRange(err.Token),
        severity: 1,
        message: err.Message,
      });
    }

    const env = new Environment();
    const origLog = console.log;
    console.log = () => {};
    try {
      for (const stmt of program.statements) {
        const result = Eval(stmt, env);
        if (result instanceof EvaluatorError) {
          diagnostics.push({
            range: tokenToRange(result.Token),
            severity: 1,
            message: result.Message,
          });
        }
      }
    } finally {
      console.log = origLog;
    }
  }

  const publishedDiagnostics = gazLightingMode
    ? [...diagnostics, ...warnings]
    : diagnostics;

  publishDiagnostics(uri, publishedDiagnostics, version);
}

function publishDiagnostics(
  uri: string,
  diagnostics: Diagnostic[],
  version?: number,
) {
  const params: Record<string, unknown> = { uri, diagnostics };
  if (typeof version === "number") {
    params.version = version;
  }

  const notification = {
    jsonrpc: "2.0",
    method: "textDocument/publishDiagnostics",
    params,
  };
  const encoded = encodeMessage(notification);
  process.stdout.write(encoded);
}

function tokenToRange(token: Token) {
  const line = token.Line - 1;
  const startChar = token.Column - 1;
  return {
    start: { line, character: startChar },
    end: { line, character: startChar + token.Literal.length },
  };
}
