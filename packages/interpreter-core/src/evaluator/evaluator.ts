import {
  CONSTANT_OBJECTS,
  OBJECTS,
  type Object,
} from "./objects/object";
import {
  ArrayLiteral,
  type Expression,
  ExpressionStatement,
  Identifier,
  LetStatement,
  type Node,
  PrefixExpression,
  Program,
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
import { Array } from "./objects/array";
import { BUILTIN_FUCTIONS, Builtin } from "./objects/builtin";
import { Environment } from "./objects/environment";
import { Error } from "./objects/error";
import { Function } from "./objects/function";
import { Integer } from "./objects/integer";
import { ReturnValue } from "./objects/return";
import { String } from "./objects/string";

export function Eval(node: Node, env: Environment): Object {
  switch (true) {
    case node instanceof Program: {
      return evalProgram(node.statements, env);
    }
    case node instanceof ExpressionStatement: {
      return Eval(node.Expression, env);
    }
    case node instanceof IntegerLiteral: {
      return new Integer(node.Value);
    }
    case node instanceof BooleanLiteral: {
      return nativeBoolToBooleanObject(node.Value);
    }
    case node instanceof BlockStatement: {
      return evalBlockStatement(node, env);
    }
    case node instanceof ArrayLiteral: {
      const elements = evalExpressions(node.elements, env);
      if (elements.length === 1 && isError(elements[0])) return elements[0];
      return new Array(elements);
    }
    case node instanceof FunctionLiteral: {
      const params = node.Params;
      const body = node.Body;
      return new Function(params, body, env);
    }
    case node instanceof StringLiteral: {
      return new String(node.Value);
    }
    case node instanceof IndexExpression: {
      const left = Eval(node.Left, env);
      if (isError(left)) {
        return left;
      }

      const index = Eval(node.Index, env);
      if (isError(index)) {
        return index;
      }

      return evaluateIndexExpression(left, index);
    }
    case node instanceof PrefixExpression: {
      const right = Eval(node.Right, env);
      if (isError(right)) {
        return right;
      }
      return evalPrefixExpression(node.Operator, right);
    }
    case node instanceof LetStatement: {
      const val = Eval(node.Value, env);
      if (isError(val)) return val;
      env.set(node.Identifier.Name, val);
      return CONSTANT_OBJECTS.null;
    }
    case node instanceof Identifier: {
      return evalIdentifier(node, env);
    }
    case node instanceof InfixExpression: {
      const left = Eval(node.Left, env);
      if (isError(left)) {
        return left;
      }

      const right = Eval(node.Right, env);
      if (isError(right)) {
        return right;
      }
      return evalInfixExpression(left, right, node.Operator);
    }
    case node instanceof ReturnStatement: {
      const val = Eval(node.ReturnValue, env);
      if (isError(val)) {
        return val;
      }
      return new ReturnValue(val);
    }
    case node instanceof IfExpression: {
      return evalIfExpression(node, env);
    }
    case node instanceof FunctionCallExpression: {
      const func = Eval(node.Function, env);
      if (isError(func)) return func;
      const args = evalExpressions(node.Arguments, env);
      if (args.length === 1 && isError(args[0])) return args[0];
      return applyFunction(func, args);
    }
    default:
      return CONSTANT_OBJECTS.null;
  }
}

function evalIdentifier(node: Identifier, env: Environment) {
  const val = env.get(node.Name) ?? BUILTIN_FUCTIONS.get(node.Name);
  if (!val)
    return new Error(
      `tire toi une buche la faut qu'on parle, ${node.Name} existe pas`,
    );

  return val;
}

function evalIfExpression(node: IfExpression, env: Environment) {
  const condition = Eval(node.Condition, env);
  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition)) {
    return Eval(node.Consequence, env);
  } else if (node.Alternative) {
    return Eval(node.Alternative, env);
  }

  return CONSTANT_OBJECTS.null;
}

function evalExpressions(exps: Expression[], env: Environment) {
  const result: Object[] = [];

  for (const e of exps) {
    const evaluated = Eval(e, env);
    if (isError(evaluated)) return [evaluated];
    result.push(evaluated);
  }

  return result;
}

function extendFunctionEnv(func: Function, args: Object[]) {
  const env = new Environment(func.env);

  func.parameters.map((param, idx) => {
    env.set(param.Name, args[idx]);
  });

  return env;
}

function unwrapReturnValue(obj: Object) {
  if (obj instanceof ReturnValue) {
    return obj.Value;
  }

  return obj;
}

function applyFunction(fn: Object, args: Object[]) {
  switch (fn.Type()) {
    case OBJECTS.FUNCTION_OBJ: {
      const extendedEnv = extendFunctionEnv(fn as Function, args);
      const evaluated = Eval((fn as Function).body, extendedEnv);
      return unwrapReturnValue(evaluated);
    }
    case OBJECTS.BUILTIN_OBJ: {
      return (fn as Builtin).func(...args);
    }
    default: {
      return new Error(
        `Arrete de niaise avec la puck, c'est pas une fonction ca c'est ${fn.Type()}`,
        fn.Inspect(),
      );
    }
  }
}

function isTruthy(obj: Object) {
  switch (obj) {
    case CONSTANT_OBJECTS.null: {
      return false;
    }
    case CONSTANT_OBJECTS.false: {
      return false;
    }
    default: {
      return true;
    }
  }
}

function evalBlockStatement(node: BlockStatement, env: Environment) {
  let result: Object;

  for (const stmt of node.statements) {
    result = Eval(stmt, env);

    if (!result) return result;

    const isReturn = result.Type() === OBJECTS.RETURN_VALUE_OBJ;
    const isError = result.Type() === OBJECTS.ERROR_OBJ;
    const shouldReturn = isReturn || isError;

    if (result && shouldReturn) return result;
  }

  return result;
}

function evalInfixExpression(left: Object, right: Object, operator: string) {
  switch (true) {
    case left.Type() === OBJECTS.INTEGER_OBJ &&
      right.Type() === OBJECTS.INTEGER_OBJ: {
      return evalIntegerInfixExpression(operator, left, right);
    }
    case left.Type() === OBJECTS.BOOLEAN_OBJ &&
      right.Type() === OBJECTS.BOOLEAN_OBJ: {
      if (operator === "==") {
        return nativeBoolToBooleanObject(left === right);
      } else if (operator === "!=") {
        return nativeBoolToBooleanObject(left !== right);
      }
      return new Error(
        `Ca marche pas ton affaire: ${left.Type()} ${operator} ${right.Type()}`,
      );
    }
    case left.Type() === OBJECTS.STRING_OBJ &&
      right.Type() === OBJECTS.STRING_OBJ: {
      return evalStringInfixExpression(operator, left, right);
    }
    case left.Type() !== right.Type():
      return new Error(
        `Tu mélanges des affaires qui se mélangent pas mon pite: ${left.Type()} pis ${right.Type()}`,
      );
    default: {
      return new Error(
        `Tu t'es tu virer une brosse en fds? ${left.Type()} ${operator} ${right.Type()}`,
      );
    }
  }
}

function evalStringInfixExpression(
  operator: string,
  left: Object,
  right: Object,
) {
  const leftVal = (left as String).Value;
  const rightVal = (right as String).Value;

  if (operator !== "+") {
    return new Error(
      `Ca a pas d'allure ton affaire: ${left.Type()} ${operator} ${right.Type()}`,
    );
  }

  return new String(leftVal + rightVal);
}

function evalIntegerInfixExpression(
  operator: string,
  left: Object,
  right: Object,
) {
  const leftVal = (left as Integer).Value;
  const rightVal = (right as Integer).Value;

  switch (operator) {
    case "+": {
      return new Integer(leftVal + rightVal);
    }
    case "-": {
      return new Integer(leftVal - rightVal);
    }
    case "/": {
      if (rightVal === 0) {
        return new Error("Esti de tawin qui essaye de diviser par zero");
      }
      return new Integer(leftVal / rightVal);
    }
    case "*": {
      return new Integer(leftVal * rightVal);
    }
    case "<": {
      return nativeBoolToBooleanObject(leftVal < rightVal);
    }
    case ">": {
      return nativeBoolToBooleanObject(leftVal > rightVal);
    }
    case "==": {
      return nativeBoolToBooleanObject(leftVal === rightVal);
    }
    case "!=": {
      return nativeBoolToBooleanObject(leftVal !== rightVal);
    }
    default: {
      return new Error(`Ca marche pus ton affaire: ${operator}`);
    }
  }
}

function evalPrefixExpression(operator: string, value: Object) {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(value);
    case "-":
      return evalMinusPrefixOperatorExpression(value);
    default:
      return new Error(`C'est quoi stafaire la: ${operator} ${value.Type()}`);
  }
}

function evalMinusPrefixOperatorExpression(value: Object) {
  if (value === CONSTANT_OBJECTS.null) {
    return new Error("Y'a rien là mon chum");
  }
  if (value.Type() !== OBJECTS.INTEGER_OBJ) {
    return new Error(`C'est quoi stafaire la: -${value.Type()}`);
  }

  return new Integer(-(value as Integer).Value);
}

function evaluateIndexExpression(left: Object, index: Object) {
  if (left.Type() !== OBJECTS.ARRAY_OBJ) {
    return new Error(`c'est pas un array ca mon chum: ${left.Type()}`);
  } else if (index.Type() !== OBJECTS.INTEGER_OBJ) {
    return new Error(`va me falloir un integer mon chum pas ${index.Type()}`);
  }

  return evalArrayIndexExpression(left, index);
}

function evalArrayIndexExpression(left: Object, index: Object) {
  const array = left as Array;
  const indexValue = (index as Integer).Value;

  if (indexValue === 0) {
    return new Error("Ca marche pas dmeme icitte");
  }

  if (indexValue < 0 || indexValue > array.Elements.length) {
    return CONSTANT_OBJECTS.null;
  }

  return array.Elements[indexValue - 1];
}

function evalBangOperatorExpression(value: Object) {
  switch (value) {
    case CONSTANT_OBJECTS.true: {
      return CONSTANT_OBJECTS.false;
    }
    case CONSTANT_OBJECTS.false: {
      return CONSTANT_OBJECTS.true;
    }
    case CONSTANT_OBJECTS.null: {
      return CONSTANT_OBJECTS.false;
    }
    default:
      return CONSTANT_OBJECTS.false;
  }
}

function isError(obj: Object) {
  return obj !== null && obj !== undefined && obj.Type() === OBJECTS.ERROR_OBJ;
}

function evalProgram(stms: Statement[], env: Environment) {
  let result: Object;

  for (const stmt of stms) {
    result = Eval(stmt, env);

    if (result instanceof ReturnValue) return result.Value;
    if (result instanceof Error) return result;
  }

  return result;
}

function nativeBoolToBooleanObject(input: boolean) {
  return input ? CONSTANT_OBJECTS.true : CONSTANT_OBJECTS.false;
}
