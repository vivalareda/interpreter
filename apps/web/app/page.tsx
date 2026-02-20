"use client";

import { Environment, Eval, Lexer, Parser } from "@repo/interpreter-core";
import { useCallback, useState } from "react";
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
    code: "MET MOI CA ICITTE arr = [1, 2, 3, 4, 5];\nGAROCHE MOI CA(len(arr));\nGAROCHE MOI CA(first(arr));\nGAROCHE MOI CA(last(arr));",
  },
  {
    label: "Récursion",
    code: "MET MOI CA ICITTE factorial = JAI JAMAIS TOUCHER A MES FILLES(n)\n  AMETON QUE (n < 2) {\n    TOKEBEC 1;\n  } SINON LA {\n    TOKEBEC n * factorial(n - 1);\n  }\nSAUF UNE FOIS AU CHALET\nGAROCHE MOI CA(factorial(5));",
  },
] as const;

export default function InterpreterPage() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeExample, setActiveExample] = useState<number | null>(null);

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
            "Erreurs d\u2019analyse:\n" +
              parser.errors.map((e) => `  ${e}`).join("\n"),
          );
          console.log = originalLog;
          console.error = originalError;
          setIsLoading(false);
          return;
        }

        const env = new Environment();
        Eval(program, env);

        console.log = originalLog;
        console.error = originalError;

        setOutput(logs.length > 0 ? logs.join("\n") : "(aucun résultat)");
      } catch (err) {
        console.log = originalLog;
        console.error = originalError;
        const message = err instanceof Error ? err.message : String(err);
        setError(`Erreur d\u2019exécution: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1>
            Interpréteur <span>Québecois</span>
          </h1>
          <p className={styles.headerSubtitle}>Playground</p>
        </div>
      </header>

      {/* Editor + Output */}
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
          <textarea
            id="code-input"
            className={styles.editor}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`MET MOI CA ICITTE x = 5;\nGAROCHE MOI CA(x);`}
            spellCheck="false"
            autoCapitalize="off"
            autoCorrect="off"
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

      {/* Action bar */}
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

      {/* Examples */}
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

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <p>
          Interpréteur Québecois &mdash; inspiré par le livre &ldquo;Writing an
          Interpreter in Go&rdquo;
        </p>
      </footer>

      {/* Syntax Reference Modal */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
