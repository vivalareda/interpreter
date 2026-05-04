export type Diagnostic = {
  range: Range;
  severity: number;
  message: string;
};

export type Range = {
  start: Position;
  end: Position;
};

export type Position = {
  line: number;
  character: number;
};

export type Message = {
  id: number;
  method: string;
};

type URI = string;
type Code = string;

export type State = {
  documents: Map<URI, Code>;
  versions: Map<URI, number>;
};

export type SplitReturn = {
  advance: number;
  content: string;
};

export type TextDocument = {
  uri: string;
  version?: number;
};

export type TextDocumentContentChangeEvent = {
  text: string;
};

export type TextDocumentDidChangeParams = {
  textDocument: TextDocument;
  contentChanges: TextDocumentContentChangeEvent[];
};

export type NotificationTextDocumentDidChange = {
  method: string;
  params: TextDocumentDidChangeParams;
};

export type TextDocumentDidOpenParams = {
  textDocument: {
    uri: string;
    text: string;
    version: number;
  };
};

export type NotificationTextDocumentDidOpen = {
  method: string;
  params: TextDocumentDidOpenParams;
};

export type TextDocumentDidSaveParams = {
  textDocument: TextDocument;
  text?: string;
};

export type NotificationTextDocumentDidSave = {
  method: string;
  params: TextDocumentDidSaveParams;
};

export type TextDocumentDidCloseParams = {
  textDocument: TextDocument;
};

export type NotificationTextDocumentDidClose = {
  method: string;
  params: TextDocumentDidCloseParams;
};

export type Capabilities = {
  textDocumentSync:
    | number
    | {
        openClose: boolean;
        change: number;
      };
};

export type ServerInfo = {
  name: string;
  version: string;
};

export type InitializeResult = {
  capabilities: Capabilities;
  serverInfo: ServerInfo;
};

export type InitializeResponse = {
  id: number;
  result: InitializeResult;
};

/// Hover

export type TextDocumentIdentifier = {
  uri: string;
};

export type HoverParams = {
  textDocument: TextDocumentIdentifier;
  position: Position;
};

export type RequestTextDocumentHover = {
  jsonrpc: "2.0";
  id: number;
  method: "textDocument/hover";
  params: HoverParams;
};

export type Hover = {
  contents: string | MarkupContent;
  range: Range;
};

export type MarkupContent = {
  kind: "plaintext" | "markdown";
  value: string;
};

export type HoverResponse = {
  jsonrpc: "2.0";
  id: number;
  result: Hover | null;
};
