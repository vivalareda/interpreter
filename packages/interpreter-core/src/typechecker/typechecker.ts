import { Error as LangError } from "../evaluator/objects/error";
import {
  ArrayLiteral,
  type Expression,
  ExpressionStatement,
  Identifier,
  LetStatement,
  PrefixExpression,
  type Program,
  ReturnStatement,
  type Statement,
} from "../parser/ast";
import { BooleanLiteral } from "../parser/nodes/BooleanExpression";
import { FunctionCallExpression } from "../parser/nodes/CallExpression";
import { FunctionLiteral } from "../parser/nodes/FunctionLiteral";
import { BlockStatement, IfExpression } from "../parser/nodes/IfExpression";
import { IndexExpression } from "../parser/nodes/IndexExpression";
import { InfixExpression } from "../parser/nodes/InfixExpression";
import { IntegerLiteral } from "../parser/nodes/IntegerLiteral";
import { StringLiteral } from "../parser/nodes/StringLiteral";
import {
  BUILTIN_TYPES,
  BUILTINS,
  T_BOOL,
  T_INT,
  T_NULL,
  T_STRING,
  type Type,
} from "./types";

export type TypeEnv = Map<string, Type>;
type Substitution = Map<string, Type>;

export class TypeChecker {
  private env: TypeEnv = new Map();
  public errors: LangError[] = [];

  check(program: Program) {
    for (const stmt of program.statements) {
      this.checkStatement(stmt, this.env);
    }
  }

  getType(name: string): Type | undefined {
    return this.env.get(name);
  }

  private checkStatement(stmt: Statement, env: TypeEnv) {
    if (stmt instanceof LetStatement) {
      const valueType = this.inferType(stmt.Value, env);
      env.set(stmt.Identifier.Name, valueType);
    }
    if (stmt instanceof ExpressionStatement) {
      this.inferType(stmt.Expression, env);
    }
    if (stmt instanceof ReturnStatement) {
      this.inferType(stmt.ReturnValue, env);
    }
  }

  private inferType(expr: Expression, env: TypeEnv): Type {
    switch (true) {
      case expr instanceof IntegerLiteral: {
        return T_INT;
      }
      case expr instanceof BooleanLiteral: {
        return T_BOOL;
      }
      case expr instanceof StringLiteral: {
        return T_STRING;
      }
      case expr instanceof FunctionLiteral: {
        const funcEnv = new Map(env);
        const paramTypes: Type[] = [];
        for (const param of expr.Params) {
          if (!param.typeAnnotation) {
            this.errors.push(
              new LangError(
                `certain que ${param.Name} a pas besoin d'un type? j'veux juste m'assurer`,
                param.Token,
              ),
            );
            continue;
          }
          const paramType = this.resolveTypeAnnotation(
            param.typeAnnotation,
            // param.Token,
          );
          funcEnv.set(param.Name, paramType);
          paramTypes.push(paramType);
        }

        const returnType = expr.ReturnType
          ? this.resolveTypeAnnotation(expr.ReturnType)
          : T_NULL;

        const isGeneric = paramTypes.some((param) => param.tag === "TypeVar");
        if (isGeneric) {
          return { tag: "Function", paramTypes, returnType };
        }

        const bodyType = this.inferBlockType(expr.Body, funcEnv);

        if (bodyType.tag !== returnType.tag) {
          this.errors.push(
            new LangError(
              `t'as dit ${returnType.tag} mais j'vois ${bodyType.tag}... c'est-tu moi qui comprends mal ou t'as changé d'idée`,
              expr.Token,
            ),
          );
        }
        return { tag: "Function", paramTypes, returnType };
      }
      case expr instanceof IndexExpression: {
        const arrType = this.inferType(expr.Left, env);
        if (arrType.tag !== "Array") {
          this.errors.push(
            new LangError(
              `certain que ${arrType.tag} c'est un tableau? j'veux juste vérifier`,
              expr.Token,
            ),
          );
          return T_NULL;
        }
        return arrType.elementType;
      }
      case expr instanceof FunctionCallExpression: {
        if (expr.Function instanceof Identifier) {
          const name = expr.Function.Name;
          if (this.isBuiltin(name)) {
            return this.handleBuiltin(name, expr.Arguments, expr.Token, env);
          }
        }

        const funcType = this.inferType(expr.Function, env);
        if (funcType.tag !== "Function") {
          this.errors.push(
            new LangError(
              `es-tu sûr que ${expr.Function} c'est une fonction icitte`,
              expr.Token,
            ),
          );
          return T_NULL;
        }
        if (expr.Arguments.length !== funcType.paramTypes.length) {
          this.errors.push(
            new LangError(
              `eille champion, j'me souviens d'avoir dit ${funcType.paramTypes.length} arguments, toi t'en passes ${expr.Arguments.length}... c'est-tu moi ou toi qui compte mal`,
              expr.Token,
            ),
          );
          return funcType.returnType;
        }
        const argTypes = expr.Arguments.map((arg) => this.inferType(arg, env));
        const sub = this.buildSubstitution(funcType.paramTypes, argTypes);

        argTypes.forEach((argType, idx) => {
          const expectedType = this.applySubstitution(
            sub,
            funcType.paramTypes[idx],
          );
          // const argType = this.inferType(arg, env);
          if (argType.tag !== expectedType.tag) {
            this.errors.push(
              new LangError(
                `certain que l'argument ${idx + 1} c'est un ${argType.tag}? j'aurais juré que ça prenait un ${funcType.paramTypes[idx].tag}`,
                expr.Token,
              ),
            );
          }
        });
        return this.applySubstitution(sub, funcType.returnType);
      }
      case expr instanceof IfExpression: {
        const conditionType = this.inferType(expr.Condition, env);
        if (conditionType.tag !== "Bool") {
          this.errors.push(
            new LangError(
              `es-tu sûr que ta condition c'est correct là, ça me semble pas être un Bool ce que t'as mis`,
              expr.Token,
            ),
          );
        }
        const consequenceType = this.inferBlockType(expr.Consequence, env);
        if (!expr.Alternative) return T_NULL;

        const alternativeType = this.inferBlockType(expr.Alternative, env);
        if (consequenceType.tag !== alternativeType.tag) {
          this.errors.push(
            new LangError(
              `les deux bords me donnent pas la même affaire, t'es sûr que c'est ce que tu voulais`,
              expr.Token,
            ),
          );
        }
        return consequenceType;
      }
      case expr instanceof Identifier: {
        const type = env.get(expr.Name);
        if (!type) {
          this.errors.push(
            new LangError(
              `${expr.Name} ça me dit rien ça, t'es sûr que t'as déclaré ça quelque part`,
              expr.Token,
            ),
          );
          return T_NULL;
        }
        return type;
      }
      case expr instanceof ArrayLiteral: {
        if (expr.elements.length === 0) {
          this.errors.push(
            new LangError(
              `ton tableau est vide, c'est-tu vraiment ce que tu voulais faire`,
              expr.Token,
            ),
          );
          return T_NULL;
        }
        const firstType = this.inferType(expr.elements[0], env);
        for (let i = 1; i < expr.elements.length; i++) {
          const elementType = this.inferType(expr.elements[i], env);
          if (elementType.tag !== firstType.tag) {
            this.errors.push(
              new LangError(
                `j'veux pas te stresser mais ${firstType.tag} pis ${elementType.tag} dans le même tableau ça fit pas vraiment`,
                expr.Token,
              ),
            );
          }
        }
        return { tag: "Array", elementType: firstType };
      }
      case expr instanceof InfixExpression: {
        const leftType = this.inferType(expr.Left, env);
        const rightType = this.inferType(expr.Right, env);
        return this.validateInfixExpression(
          expr.Operator,
          leftType,
          rightType,
          expr.Token,
        );
      }
      case expr instanceof PrefixExpression: {
        const rightType = this.inferType(expr.Right, env);
        return this.validatePrefixExpression(
          expr.Operator,
          rightType,
          expr.Token,
        );
      }
      default: {
        return T_NULL;
      }
    }
  }

  private inferBlockType(block: BlockStatement, env: TypeEnv): Type {
    for (const stmt of block.statements) {
      if (stmt instanceof ReturnStatement) {
        return this.inferType(stmt.ReturnValue, env);
      }
    }
    return T_NULL;
  }

  private validatePrefixExpression(
    operator: string,
    right: Type,
    token: LangError["Token"],
  ): Type {
    switch (operator) {
      case "!": {
        if (right.tag !== "Bool") {
          this.errors.push(
            new LangError(
              `es-tu sûr que ${right.tag} c'est ce que tu veux mettre après un !, j'aurais cru que c'était un Bool`,
              token,
            ),
          );
        }
        return T_BOOL;
      }
      case "-": {
        if (right.tag !== "Int") {
          this.errors.push(
            new LangError(
              `certain que tu veux mettre un - devant un ${right.tag}? ça me semble bizarre`,
              token,
            ),
          );
        }
        return T_INT;
      }
      default: {
        this.errors.push(
          new LangError(
            `${operator} j'connais pas ça moi, t'es sûr que c'est le bon opérateur`,
            token,
          ),
        );
        return T_NULL;
      }
    }
  }

  private validateInfixExpression(
    operator: string,
    left: Type,
    right: Type,
    token: LangError["Token"],
  ): Type {
    switch (operator) {
      case "+": {
        if (left.tag === "Int" && right.tag === "Int") return T_INT;
        if (left.tag === "String" && right.tag === "String") return T_STRING;
        this.errors.push(
          new LangError(
            `j'veux pas te stresser mais ${left.tag} pis ${right.tag} ça fit pas vraiment ensemble avec un +`,
            token,
          ),
        );
        return T_NULL;
      }
      case "-":
      case "*":
      case "/": {
        if (left.tag !== "Int") {
          this.errors.push(
            new LangError(
              `certain que la partie de gauche c'est correct, ça me semble pas être un Int ce que t'as mis`,
              token,
            ),
          );
        }
        if (right.tag !== "Int") {
          this.errors.push(
            new LangError(
              `certain que la partie de droite c'est correct, ça me semble pas être un Int ce que t'as mis`,
              token,
            ),
          );
        }
        return T_INT;
      }
      case "<":
      case ">": {
        if (left.tag !== "Int") {
          this.errors.push(
            new LangError(
              `pour comparer faut des Int des deux bords, la gauche c'est un ${left.tag} là`,
              token,
            ),
          );
        }
        if (right.tag !== "Int") {
          this.errors.push(
            new LangError(
              `pour comparer faut des Int des deux bords, la droite c'est un ${right.tag} là`,
              token,
            ),
          );
        }
        return T_BOOL;
      }
      case "==":
      case "!=": {
        if (left.tag !== right.tag) {
          this.errors.push(
            new LangError(
              `t'es sûr que tu veux comparer un ${left.tag} avec un ${right.tag}? ça me semble pas pareil`,
              token,
            ),
          );
        }
        return T_BOOL;
      }
      default: {
        this.errors.push(
          new LangError(
            `${operator} j'connais pas ça moi, t'es sûr que c'est le bon opérateur`,
            token,
          ),
        );
        return T_NULL;
      }
    }
  }

  private resolveTypeAnnotation(
    annotation: string,
    // token: LangError["Token"],
  ): Type {
    switch (annotation) {
      case "Int":
        return T_INT;
      case "Bool":
        return T_BOOL;
      case "String":
        return T_STRING;
      case "Null":
        return T_NULL;
      default: {
        return { tag: "TypeVar", name: annotation };
        // this.errors.push(
        //   new LangError(
        //     `${annotation} ça me dit rien comme type, t'es sûr que c'est correct ça`,
        //     token,
        //   ),
        // );
        // return T_NULL;
      }
    }
  }

  private buildSubstitution(paramTypes: Type[], args: Type[]): Substitution {
    const sub: Substitution = new Map();
    for (let i = 0; i < paramTypes.length; i++) {
      const param = paramTypes[i];
      const arg = args[i];
      if (param.tag === "TypeVar" && !sub.has(param.name)) {
        sub.set(param.name, arg);
      }
    }
    return sub;
  }

  private applySubstitution(sub: Substitution, type: Type): Type {
    switch (type.tag) {
      case "TypeVar": {
        return sub.get(type.name) ?? type;
      }
      case "Function": {
        return {
          tag: "Function",
          paramTypes: type.paramTypes.map((param) =>
            this.applySubstitution(sub, param),
          ),
          returnType: this.applySubstitution(sub, type.returnType),
        };
      }
      case "Array": {
        return {
          tag: "Array",
          elementType: this.applySubstitution(sub, type.elementType),
        };
      }
      default: {
        return type;
      }
    }
  }

  isBuiltin(name: string): name is (typeof BUILTINS)[number] {
    return ["GAROCHE MOI CA", "CEST LONG COMMENT", "BOUTE DU BOUTE"].includes(
      name,
    );
  }

  handleBuiltin(
    name: (typeof BUILTINS)[number],
    args: Expression[],
    token: LangError["Token"],
    env: TypeEnv,
  ): Type {
    if (name === "BOUTE DU BOUTE") {
      const argType = this.inferType(args[0], env);
      if (argType.tag !== "Array") {
        this.errors.push(
          new LangError(
            `certain que ${argType.tag} c'est un tableau? j'veux juste vérifier`,
            token,
          ),
        );
        return T_NULL;
      }
      return argType.elementType;
    }

    return BUILTIN_TYPES[name];
  }
}
