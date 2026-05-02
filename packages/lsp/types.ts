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