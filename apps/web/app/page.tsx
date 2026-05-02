"use client";

import {
  BUILTIN_FUCTIONS,
  Environment,
  Eval,
  InterpreterError,
  Lexer,
  Parser,
} from "@repo/interpreter-core";
import { useCallback, useMemo, useState } from "react";
import {
  CodeEditor,
  type EditorDiagnostic,
  type Theme,
  themes,
} from "./code-editor";
import styles from "./page.module.css";

const EXAMPLES = [
  {
    label: "Variables",
    code: "MET MOI CA ICITTE x = 5;\nGAROCHE MOI CA(x);",
  },
  {
    label: "Chaînes",
    code: 'MET MOI CA ICITTE greeting = "Bonjour!";\nGAROCHE MOI CA(greeting);',
  },
  {
    label: "Condition",
    code: 'MET MOI CA ICITTE x = 10;\nAMETON QUE (x > 5) {\n  GAROCHE MOI CA("x est plus grand que 5");\n}',
  },
  {
    label: "Fonctions",
    code: "MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y) \n  x + y;\nSAUF UNE FOIS AU CHALET\nGAROCHE MOI CA(add(3, 4));",
  },
  {
    label: "Tableaux",
    code: "MET MOI CA ICITTE arr = [1, 2, 3, 4, 5];\nGAROCHE MOI CA(CEST LONG COMMENT(arr));\nGAROCHE MOI CA(arr[1]);\nGAROCHE MOI CA(BOUTE DU BOUTE(arr));",
  },
  {
    label: "Récursion",
    code: "MET MOI CA ICITTE factorial = JAI JAMAIS TOUCHER A MES FILLES(n)\n  AMETON QUE (n < 2) {\n    TOKEBEC 1;\n  } SINON LA {\n    TOKEBEC n * factorial(n - 1);\n  }\nSAUF UNE FOIS AU CHALET\nGAROCHE MOI CA(factorial(5));",
  },
  {
    label: "Erreurs",
    code: `TYL Chaque ligne produit un message d'erreur different
MET MOI CA ICITTE x = 5;
TYL 1. Appeler un entier comme une fonction
x();

TYL 2. Variable inexistante
GAROCHE MOI CA(inexistant);

TYL 3. Mauvais nombre d'arguments
CEST LONG COMMENT();

TYL 4. Longueur sur un entier
CEST LONG COMMENT(42);

TYL 5. Opération entre types incompatibles
"hello" - "world";

TYL 6. Division par zéro
10 / 0;

TYL 7. Index sur un non-tableau
42[1];

TYL 8. Index avec un non-entier
MET MOI CA ICITTE arr = [1, 2];
arr["a"];

TYL 9. Index à zéro (interdit)
arr[0];

TYL 10. Négation d'un non-entier
-"hello";

TYL 11. Même type non-supporté
[1] + [2];`,
  },
] as const;

function computeDiagnostics(code: string): EditorDiagnostic[] {
  if (!code.trim()) return [];

  try {
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    const diagnostics: EditorDiagnostic[] = parser.errors.map((err) => ({
      line: err.token.Line,
      column: err.token.Column,
      length: err.token.Literal.length,
      message: err.message,
    }));

    if (parser.errors.length === 0) {
      const env = new Environment();
      const origLog = console.log;
      const origError = console.error;
      console.log = () => {};
      console.error = () => {};
      try {
        for (const stmt of program.statements) {
          const result = Eval(stmt, env);
          if (result instanceof InterpreterError) {
            diagnostics.push({
              line: result.Token.Line,
              column: result.Token.Column,
              length: result.Token.Literal.length,
              message: result.Message,
            });
          }
        }
      } finally {
        console.log = origLog;
        console.error = origError;
      }
    }

    return diagnostics;
  } catch {
    return [];
  }
}

export default function InterpreterPage() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [activeExample, setActiveExample] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>("forest");

  const diagnostics = useMemo(() => computeDiagnostics(code), [code]);

  const executeCode = useCallback(async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setOutput("");
    setError("");

    try {
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;

      console.log = (...args: unknown[]) => {
        logs.push(args.map((arg) => String(arg)).join(" "));
      };
      console.error = (...args: unknown[]) => {
        logs.push(args.map((arg) => String(arg)).join(" "));
      };

      try {
        const lexer = new Lexer(code);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        if (parser.errors.length > 0) {
          setError(
            "Erreurs d'analyse:\n" +
              parser.errors.map((e) => `  ${e.message}`).join("\n"),
          );
          console.log = originalLog;
          console.error = originalError;
          setIsLoading(false);
          return;
        }

        const env = new Environment();
        const result = Eval(program, env);

        console.log = originalLog;
        console.error = originalError;

        if (result instanceof InterpreterError) {
          setError(result.Message);
          setIsLoading(false);
          return;
        }

        setOutput(logs.length > 0 ? logs.join("\n") : "(aucun résultat)");
      } catch (err) {
        console.log = originalLog;
        console.error = originalError;
        const message = err instanceof Error ? err.message : String(err);
        setError(`Erreur d'exécution: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeCode();
    }
  };

  const loadExample = (index: number) => {
    const example = EXAMPLES[index];
    if (!example) return;
    setCode(example.code);
    setActiveExample(index);
    setError("");
    setOutput("");
  };

  const clearAll = () => {
    setCode("");
    setOutput("");
    setError("");
    setActiveExample(null);
  };

  const t = themes[theme];
  const themeVars = {
    "--bg-primary": t.bg,
    "--bg-secondary": t.bgSurface,
    "--bg-surface": t.bgSurface,
    "--bg-surface-hover": t.bgElevated,
    "--bg-elevated": t.bgElevated,
    "--text-primary": t.text,
    "--text-muted": t.textMuted,
    "--accent": t.accent,
    "--border": t.border,
  } as React.CSSProperties;

  return (
    <div className={styles.container} style={themeVars}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1>
            Interpréteur <span>Québecois</span>
          </h1>
          <p className={styles.headerSubtitle}>Playground</p>
        </div>
        <div className={styles.themeToggle}>
          {(["forest", "ocean", "light"] as Theme[]).map((t) => (
            <button
              key={t}
              className={`${styles.themeButton} ${theme === t ? styles.themeButtonActive : ""}`}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.editorSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionDot}>
              <span />
              <span />
              <span />
            </div>
            <label htmlFor="code-input">code</label>
          </div>
          <CodeEditor
            value={code}
            onChange={setCode}
            onKeyDown={handleKeyDown}
            className={styles.editor}
            theme={theme}
            diagnostics={diagnostics}
          />
        </div>

        <div className={styles.outputSection}>
          <div className={styles.sectionHeader}>
            <label>résultat</label>
            <span className={styles.hint}>
              <span className={styles.hintKey}>&#8984;</span>
              <span className={styles.hintKey}>&#9166;</span> exécuter
            </span>
          </div>
          {error ? (
            <pre className={styles.error}>
              <code>{error}</code>
            </pre>
          ) : (
            <pre
              className={`${styles.output} ${isLoading ? styles.loading : ""}`}
            >
              <code>{output || "(aucun résultat)"}</code>
            </pre>
          )}
        </div>
      </main>

      <div className={styles.actionBar}>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.runButton}`}
            onClick={executeCode}
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? "Exécution\u2026" : "Exécuter"}
          </button>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={clearAll}
          >
            Effacer
          </button>
        </div>
        <button
          className={`${styles.button} ${styles.syntaxButton}`}
          onClick={() => setShowModal(true)}
        >
          Référence
        </button>
      </div>

      <section className={styles.examples}>
        <p className={styles.examplesLabel}>Exemples</p>
        <div className={styles.exampleGrid}>
          {EXAMPLES.map((example, i) => (
            <button
              key={example.label}
              className={`${styles.exampleButton} ${activeExample === i ? styles.exampleButtonActive : ""}`}
              onClick={() => loadExample(i)}
            >
              {example.label}
            </button>
          ))}
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <p>
          Interpréteur Québecois &mdash; inspiré par le livre &ldquo;Writing an
          Interpreter in Go&rdquo;
        </p>
      </footer>

      <div
        className={`${styles.modalOverlay} ${showModal ? styles.open : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Référence syntaxique"
      >
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>Référence</h2>
            <button
              className={styles.closeButton}
              onClick={() => setShowModal(false)}
              aria-label="Fermer"
            >
              &#10005;
            </button>
          </div>
          <div className={styles.modalContent}>
            <h3>Déclaration de variables</h3>
            <p>
              Utilisez <code>MET MOI CA ICITTE</code> pour déclarer une variable
              :
            </p>
            <pre>
              <code>MET MOI CA ICITTE nom = valeur;</code>
            </pre>

            <h3>Conditions</h3>
            <p>
              Utilisez <code>AMETON QUE</code> pour une condition :
            </p>
            <pre>
              <code>{`AMETON QUE (condition) {
  ...
}`}</code>
            </pre>
            <p>
              Ajoutez <code>SINON LA</code> pour le else :
            </p>
            <pre>
              <code>{`AMETON QUE (condition) {
  ...
} SINON LA {
  ...
}`}</code>
            </pre>

            <h3>Fonctions</h3>
            <p>
              Déclarez avec <code>JAI JAMAIS TOUCHER A MES FILLES</code> et
              terminez avec <code>SAUF UNE FOIS AU CHALET</code> :
            </p>
            <pre>
              <code>{`MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y)
  x + y;
SAUF UNE FOIS AU CHALET`}</code>
            </pre>

            <h3>Retour</h3>
            <p>
              Utilisez <code>TOKEBEC</code> pour retourner une valeur :
            </p>
            <pre>
              <code>{`MET MOI CA ICITTE double = JAI JAMAIS TOUCHER A MES FILLES(x)
  TOKEBEC x * 2;
SAUF UNE FOIS AU CHALET`}</code>
            </pre>

            <h3>Affichage</h3>
            <p>
              <code>GAROCHE MOI CA()</code> affiche dans le résultat :
            </p>
            <pre>
              <code>{`GAROCHE MOI CA("Bonjour");
GAROCHE MOI CA(x);`}</code>
            </pre>

            <h3>Fonctions intégrées</h3>
            <p>
              <code>CEST LONG COMMENT(x)</code> — longueur d&apos;une chaîne ou
              tableau
            </p>
            <p>
              <code>BOUTE DU BOUTE(arr)</code> — dernier élément d&apos;un
              tableau
            </p>

            <h3>Opérateurs</h3>
            <p>
              Arithmétique : <code>+</code> <code>-</code> <code>*</code>{" "}
              <code>/</code>
            </p>
            <p>
              Comparaison : <code>==</code> <code>!=</code> <code>&lt;</code>{" "}
              <code>&gt;</code>
            </p>
            <p>
              Logique : <code>!</code> (NOT)
            </p>

            <h3>Commentaires</h3>
            <p>
              Utilisez <code>TYL</code> pour un commentaire sur une ligne :
            </p>
            <pre>
              <code>TYL ceci est un commentaire</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
