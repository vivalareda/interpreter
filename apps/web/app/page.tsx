"use client";

import { useState } from "react";
import { Lexer, Parser, Eval, Environment } from "@repo/interpreter-core";
import styles from "./page.module.css";

export default function InterpreterPage() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const executeCode = async () => {
    setIsLoading(true);
    setOutput("");
    setError("");

    try {
      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;

      console.log = (...args: any[]) => {
        logs.push(args.map((arg) => String(arg)).join(" "));
      };
      console.error = (...args: any[]) => {
        logs.push(args.map((arg) => String(arg)).join(" "));
      };

      try {
        const lexer = new Lexer(code);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();

        if (parser.errors.length > 0) {
          setError(
            "Erreurs d'analyse:\n" + parser.errors.map((e) => `  ${e}`).join("\n")
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

        // Only show console output, not the return value
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      executeCode();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Interpréteur Québecois</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.editorSection}>
          <div className={styles.sectionHeader}>
            <label htmlFor="code-input">Code</label>
            <span className={styles.hint}>Ctrl+Entrée pour exécuter</span>
          </div>
          <textarea
            id="code-input"
            className={styles.editor}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`MET MOI CA ICITTE x = 5;\nputs(x);`}
            spellCheck="false"
          />
        </div>

        <div className={styles.outputSection}>
          <div className={styles.sectionHeader}>
            <label>Résultat</label>
          </div>
          {error && (
            <pre className={styles.error}>
              <code>{error}</code>
            </pre>
          )}
          {!error && (
            <pre className={styles.output}>
              <code>{output || "(aucun résultat)"}</code>
            </pre>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.buttonGroup}>
          <button
            className={styles.button}
            onClick={executeCode}
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? "Exécution..." : "Exécuter"}
          </button>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => {
              setCode("");
              setOutput("");
              setError("");
            }}
          >
            Effacer
          </button>
        </div>
        <button
          className={`${styles.button} ${styles.syntaxButton}`}
          onClick={() => setShowModal(true)}
        >
          Syntaxe
        </button>
      </div>

      <div className={styles.examples}>
        <h2>Exemples</h2>
        <div className={styles.exampleGrid}>
          <button
            className={styles.exampleButton}
            onClick={() => {
              setCode("MET MOI CA ICITTE x = 5;\nputs(x);");
              setError("");
              setOutput("");
            }}
          >
            Variables
          </button>
          <button
            className={styles.exampleButton}
            onClick={() => {
              setCode('MET MOI CA ICITTE greeting = "Bonjour!";\nputs(greeting);');
              setError("");
              setOutput("");
            }}
          >
            Chaînes
          </button>
          <button
            className={styles.exampleButton}
            onClick={() => {
              setCode(
                "MET MOI CA ICITTE x = 10;\nAMETON QUE (x > 5) {\nputs(\"x est plus grand que 5\");\n}"
              );
              setError("");
              setOutput("");
            }}
          >
            Condition
          </button>
          <button
            className={styles.exampleButton}
            onClick={() => {
              setCode(
                "MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y) {\nx + y;\nSAUF UNE FOIS AU CHALET\nputs(add(3, 4));"
              );
              setError("");
              setOutput("");
            }}
          >
            Fonctions
          </button>
        </div>
      </div>

      {/* Modal */}
      <div className={`${styles.modalOverlay} ${showModal ? styles.open : ""}`}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>Syntaxe</h2>
            <button
              className={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
          </div>
          <div className={styles.modalContent}>
            <h3>Déclaration de variables</h3>
            <p>Utilisez <code>MET MOI CA ICITTE</code> pour déclarer une variable:</p>
            <pre>MET MOI CA ICITTE nom = valeur;</pre>

            <h3>Conditions</h3>
            <p>Utilisez <code>AMETON QUE</code> pour une condition if:</p>
            <pre>AMETON QUE (condition) {"{"}
              ...
              {"}"}
            </pre>
            <p>Utilisez <code>SINON LA</code> pour else:</p>
            <pre>AMETON QUE (condition) {"{"}
              ...
              {"} "}
              SINON LA {"{"}
              ...
              {"}"}
            </pre>

            <h3>Fonctions</h3>
            <p>Déclarez une fonction avec <code>JAI JAMAIS TOUCHER A MES FILLES</code> et terminez avec <code>SAUF UNE FOIS AU CHALET</code>:</p>
            <pre>MET MOI CA ICITTE add = JAI JAMAIS TOUCHER A MES FILLES(x, y)
              {"\n"}
              x + y;
              {"\n"}
              SAUF UNE FOIS AU CHALET
            </pre>

            <h3>Affichage</h3>
            <p>Utilisez <code>puts()</code> pour afficher des valeurs:</p>
            <pre>puts("Bonjour");
              puts(x);
            </pre>

            <h3>Retour de fonction</h3>
            <p>Utilisez <code>TOKEBEC</code> pour retourner une valeur:</p>
            <pre>MET MOI CA ICITTE double = JAI JAMAIS TOUCHER A MES FILLES(x)
              TOKEBEC x * 2;
              SAUF UNE FOIS AU CHALET
            </pre>

            <h3>Opérateurs</h3>
            <p><code>+</code> addition, <code>-</code> soustraction, <code>*</code> multiplication, <code>/</code> division</p>
            <p><code>==</code> égal, <code>!=</code> différent, <code>&lt;</code> plus petit, <code>&gt;</code> plus grand</p>
            <p><code>!</code> NOT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
