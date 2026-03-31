"use client";

import Editor from "react-simple-code-editor";
import Prism from "prismjs";

type CodeEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: React.KeyboardEventHandler<HTMLElement>;
  placeholder: string;
  className?: string;
  textareaClassName?: string;
  preClassName?: string;
  placeholderClassName?: string;
};

Prism.languages.quebecois = {
  string: {
    pattern: /"(?:\\.|[^"\\])*"/,
    greedy: true,
  },
  keyword:
    /\b(?:MET MOI CA ICITTE|AMETON QUE|TOKEBEC|JAI JAMAIS TOUCHER A MES FILLES|SAUF UNE FOIS AU CHALET|SINON LA)\b/,
  builtin: /\b(?:GAROCHE MOI CA|len|first|last|tail|push)\b/,
  boolean: /\b(?:true|false)\b/,
  number: /\b\d+\b/,
  operator: /==|!=|[+\-*/=!<>]/,
  punctuation: /[()[\]{};,:]/,
};

const quebecoisGrammar = Prism.languages.quebecois;

export function CodeEditor({
  id,
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  textareaClassName,
  preClassName,
  placeholderClassName,
}: CodeEditorProps) {
  return (
    <div className={className}>
      {!value && <div className={placeholderClassName}>{placeholder}</div>}
      <Editor
        textareaId={id}
        value={value}
        onValueChange={onChange}
        highlight={(code) =>
          Prism.highlight(code, quebecoisGrammar, "quebecois")
        }
        padding={20}
        tabSize={2}
        insertSpaces
        onKeyDown={onKeyDown}
        textareaClassName={textareaClassName}
        preClassName={preClassName}
      />
    </div>
  );
}
