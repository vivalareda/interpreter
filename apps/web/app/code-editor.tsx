"use client";

import { useRef, useEffect } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, hoverTooltip } from "@codemirror/view";
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle, HighlightStyle, indentOnInput, foldGutter, bracketMatching } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { linter, forceLinting, type Diagnostic as CMDiagnostic } from "@codemirror/lint";
import { Lexer, Parser, TypeChecker, type Type } from "@repo/interpreter-core";

type Theme = "forest" | "ocean" | "light";

const themes: Record<Theme, { keyword: string; string: string; number: string; bool: string; comment: string; operator: string; punctuation: string; variable: string; function: string; type: string; bg: string; bgSurface: string; bgElevated: string; text: string; textMuted: string; accent: string; border: string; selection: string; }> = {
  forest: {
    keyword: "#d4a043",
    string: "#9fd0ff",
    number: "#f38ba0",
    bool: "#f38ba0",
    comment: "#635e58",
    operator: "#d7d2c7",
    punctuation: "#d7d2c7",
    variable: "#e8e4dd",
    function: "#84c59a",
    type: "#cba6f7",
    bg: "#0c110e",
    bgSurface: "#1a221c",
    bgElevated: "#242f27",
    text: "#e8e4dd",
    textMuted: "#635e58",
    accent: "#d4a043",
    border: "rgba(255,255,255,0.06)",
    selection: "rgba(212,160,67,",
  },
  ocean: {
    keyword: "#ff7b72",
    string: "#a5d6ff",
    number: "#79c0ff",
    bool: "#79c0ff",
    comment: "#8b949e",
    operator: "#c9d1d9",
    punctuation: "#c9d1d9",
    variable: "#e6edf3",
    function: "#d2a8ff",
    type: "#ffa657",
    bg: "#0d1117",
    bgSurface: "#161b22",
    bgElevated: "#21262d",
    text: "#e6edf3",
    textMuted: "#6e7681",
    accent: "#58a6ff",
    border: "rgba(255,255,255,0.08)",
    selection: "rgba(56,139,253,",
  },
  light: {
    keyword: "#d73a49",
    string: "#032f62",
    number: "#005cc5",
    bool: "#005cc5",
    comment: "#6a737d",
    operator: "#24292e",
    punctuation: "#24292e",
    variable: "#24292e",
    function: "#6f42c1",
    type: "#22863a",
    bg: "#ffffff",
    bgSurface: "#f6f8fa",
    bgElevated: "#eaecef",
    text: "#24292e",
    textMuted: "#6a737d",
    accent: "#0366d6",
    border: "rgba(0,0,0,0.08)",
    selection: "rgba(3,102,214,",
  },
};

function createHighlightStyle(theme: Theme) {
  const t = themes[theme];
  return HighlightStyle.define([
    { tag: tags.keyword, color: t.keyword },
    { tag: tags.string, color: t.string },
    { tag: tags.number, color: t.number },
    { tag: tags.bool, color: t.bool },
    { tag: tags.comment, color: t.comment, fontStyle: "italic" },
    { tag: tags.operator, color: t.operator },
    { tag: tags.punctuation, color: t.punctuation },
    { tag: tags.variableName, color: t.variable },
    { tag: tags.function(tags.variableName), color: t.function },
    { tag: tags.function(tags.name), color: t.function },
    { tag: tags.typeName, color: t.type },
  ]);
}

function createEditorTheme(theme: Theme) {
  const t = themes[theme];
  return EditorView.theme({
    "&": {
      fontSize: "0.875rem",
      fontFamily: "'JetBrains Mono', 'Menlo', monospace",
      lineHeight: "1.7",
      backgroundColor: t.bgSurface,
    },
    ".cm-content": {
      padding: "20px 0",
      caretColor: t.accent,
    },
    ".cm-gutters": {
      background: t.bgSurface,
      borderRight: "none",
      color: t.textMuted,
    },
    ".cm-activeLineGutter": {
      background: t.bgElevated,
    },
    ".cm-activeLine": {
      background: `${t.selection}0.04)`,
    },
    ".cm-cursor": {
      borderLeftColor: t.accent,
      borderLeftWidth: "2px",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      background: `${t.selection}0.2) !important`,
    },
    ".cm-matchingBracket": {
      background: `${t.selection}0.25)`,
      outline: `1px solid ${t.selection}0.5)`,
    },
    ".cm-foldPlaceholder": {
      color: t.textMuted,
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-diagnostic": {
      backgroundColor: t.bgElevated,
      color: t.text,
      borderLeft: `3px solid ${t.accent}`,
    },
    ".cm-diagnosticText": {
      color: t.text,
    },
    ".cm-diagnosticAction": {
      color: t.accent,
    },
    ".cm-tooltip.cm-tooltip-lint": {
      backgroundColor: t.bgElevated,
      color: t.text,
      border: `1px solid ${t.border}`,
      borderRadius: "6px",
      boxShadow: `0 4px 12px ${t.border}`,
    },
    ".cm-lintRange-error": {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='3'%3E%3Cpath d='M0 3L3 0 6 3' fill='none' stroke='%23${t.accent.replace("#", "")}' stroke-width='1.2'/%3E%3C/svg%3E")`,
      backgroundPosition: "left bottom",
      backgroundRepeat: "repeat-x",
    },
    ".cm-panel.cm-panel-lint": {
      backgroundColor: t.bgSurface,
      color: t.text,
      borderTop: `1px solid ${t.border}`,
    },
    ".cm-panel.cm-panel-lint ul li:hover": {
      backgroundColor: t.bgElevated,
    },
    ".cm-joual-hover": {
      padding: "4px 10px",
      fontFamily: "'JetBrains Mono', 'Menlo', monospace",
      fontSize: "0.8rem",
      color: t.text,
    },
    ".cm-tooltip": {
      backgroundColor: t.bgElevated,
      border: `1px solid ${t.border}`,
      borderRadius: "6px",
      boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
    },
  });
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

const joualHover = hoverTooltip((view, pos) => {
  const text = view.state.doc.toString();
  let start = pos;
  let end = pos;
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) start--;
  while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) end++;
  if (start === end) return null;
  const word = text.slice(start, end);

  try {
    const lexer = new Lexer(text);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    if (parser.errors.length > 0) return null;

    const typeChecker = new TypeChecker();
    typeChecker.check(program);
    const type = typeChecker.getType(word);
    if (!type) return null;

    return {
      pos: start,
      end,
      above: true,
      create() {
        const dom = document.createElement("div");
        dom.className = "cm-joual-hover";
        dom.textContent = `${word}: ${formatType(type)}`;
        return { dom };
      },
    };
  } catch {
    return null;
  }
});

const joualLanguage = StreamLanguage.define<{ expectType: boolean }>({
  name: "joual",
  tokenTable: {
    function: tags.function(tags.name),
    typeName: tags.typeName,
  },
  startState() {
    return { expectType: false };
  },
  token(stream, state) {
    if (stream.eatSpace()) return null;

    const remaining = stream.string.slice(stream.pos);

    const multiWordTokens: [string, string][] = [
      ["MET MOI CA ICITTE", "keyword"],
      ["JAI JAMAIS TOUCHER A MES FILLES", "keyword"],
      ["SAUF UNE FOIS AU CHALET", "keyword"],
      ["GAROCHE MOI CA", "function"],
      ["CEST LONG COMMENT", "function"],
      ["BOUTE DU BOUTE", "function"],
      ["AMETON QUE", "keyword"],
      ["SINON LA", "keyword"],
    ];

    for (const [kw, style] of multiWordTokens) {
      if (remaining.startsWith(kw)) {
        const after = remaining[kw.length];
        if (!after || !/[a-zA-Z]/.test(after)) {
          stream.pos += kw.length;
          return style;
        }
      }
    }

    if (remaining.startsWith("TOKEBEC")) {
      const after = remaining[7];
      if (!after || !/[a-zA-Z]/.test(after)) {
        stream.pos += 7;
        return "keyword";
      }
    }

    if (remaining.startsWith("true")) {
      const after = remaining[4];
      if (!after || !/[a-zA-Z]/.test(after)) {
        stream.pos += 4;
        return "bool";
      }
    }

    if (remaining.startsWith("false")) {
      const after = remaining[5];
      if (!after || !/[a-zA-Z]/.test(after)) {
        stream.pos += 5;
        return "bool";
      }
    }

    if (remaining.startsWith("TYL")) {
      stream.skipToEnd();
      return "comment";
    }

    if (remaining[0] === '"') {
      stream.next();
      while (!stream.eol() && stream.peek() !== '"') stream.next();
      if (stream.peek() === '"') stream.next();
      return "string";
    }

    if (/^\d/.test(remaining)) {
      stream.match(/^\d+/);
      return "number";
    }

    if (remaining.startsWith("==") || remaining.startsWith("!=") || remaining.startsWith("->")) {
      stream.pos += 2;
      if (remaining.startsWith("->")) state.expectType = true;
      return "operator";
    }

    if (/^[+\-*/=!<>]/.test(remaining[0])) {
      stream.next();
      return "operator";
    }

    if (remaining[0] === ":") {
      stream.next();
      state.expectType = true;
      return "punctuation";
    }

    if (/^[()[\]{};,]/.test(remaining[0])) {
      stream.next();
      return "punctuation";
    }

    if (/^\w/.test(remaining)) {
      stream.match(/^\w+/);

      if (state.expectType) {
        state.expectType = false;
        return "typeName";
      }

      // Check if this identifier is followed by '(' (function call)
      let pos = stream.pos;
      while (pos < stream.string.length && /\s/.test(stream.string[pos])) pos++;
      if (stream.string[pos] === "(") {
        return "function";
      }

      return "variableName";
    }

    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: "TYL" },
    closeBrackets: { brackets: ["(", "[", "{", '"'] },
  },
});

export type EditorDiagnostic = {
  line: number;
  column: number;
  length: number;
  message: string;
};

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  className?: string;
  theme?: Theme;
  diagnostics?: EditorDiagnostic[];
};

export function CodeEditor({
  value,
  onChange,
  onKeyDown,
  className,
  theme = "forest",
  diagnostics = [],
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const diagnosticsRef = useRef<CMDiagnostic[]>([]);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!editorRef.current) return;

    const highlightStyle = createHighlightStyle(theme);
    const editorTheme = createEditorTheme(theme);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        bracketMatching(),
        closeBrackets(),
        joualLanguage,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        syntaxHighlighting(highlightStyle),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        editorTheme,
        linter(() => diagnosticsRef.current),
        joualHover,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const doc = view.state.doc;
    const cmDiagnostics: CMDiagnostic[] = diagnostics.map((d) => {
      const line = doc.line(Math.max(1, Math.min(d.line, doc.lines)));
      const from = line.from + Math.max(0, d.column - 1);
      const to = from + d.length;
      return {
        from,
        to: Math.min(to, line.to),
        message: d.message,
        severity: "error",
      };
    });

    diagnosticsRef.current = cmDiagnostics;
    forceLinting(view);
  }, [diagnostics]);

  useEffect(() => {
    if (!onKeyDown) return;

    const editorEl = editorRef.current;
    if (!editorEl) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        onKeyDown(e as any);
      }
    };

    editorEl.addEventListener("keydown", handler);
    return () => editorEl.removeEventListener("keydown", handler);
  }, [onKeyDown]);

  return <div ref={editorRef} className={className} />;
}

export { type Theme, themes };
