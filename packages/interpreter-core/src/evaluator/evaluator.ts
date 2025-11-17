import { Identifier, ExpressionStatement, LetStatement, PrefixExpression, Program, ReturnStatement, type Node, type Statement, type Expression } from "../parser/ast.js";
import { Hash } from "./hash.js";
import type { KeyValuePair } from "../parser/nodes/HashLiteral.js";
import { HashLiteral } from "../parser/nodes/HashLiteral.js";
import { Integer } from "./integer.js";
import { type Hashable, ReturnValue, type Object, OBJECTS } from "./object.js";
import { IntegerLiteral } from "../parser/nodes/IntegerLiteral.js";
import { BooleanLiteral } from "../parser/nodes/BooleanExpression.js";
import { Boolean } from "./boolean.js";
import { Null } from "./null.js";
import { InfixExpression } from "../parser/nodes/InfixExpression.js";
import { BlockStatement, IfExpression } from "../parser/nodes/IfExpression.js";
import { Error } from "./error.js";
import { Environment } from "./environment.js";
import { FunctionLiteral } from "../parser/nodes/FunctionLiteral.js";
import { Function } from "./function.js";
import { FunctionCallExpression } from "../parser/nodes/CallExpression.js";
import { StringLiteral } from "../parser/nodes/StringLiteral.js";
import { String } from "./string.js";
import { Builtin, BUILTINS } from "./builtin.js";
import { ArrayLiteral } from "../parser/nodes/ArrayLiteral.js";
import { Array as ArrayObj } from "./array.js";
import { IndexExpression } from "../parser/nodes/IndexExpression.js";

const TRUE = new Boolean(true);
const FALSE = new Boolean(false);
const NULL = new Null();

export const OBJ = { TRUE, FALSE, NULL };

export function Eval(node: Node, env: Environment): Object {
  let right: Object;
  let left: Object;

  switch (true) {
    case (node instanceof StringLiteral):
      return new String(node.Value);
    case (node instanceof Identifier):
      return EvalIdentifier(node, env);
    case (node instanceof Program):
      return EvalProgram(node.statements, env);
    case (node instanceof ExpressionStatement):
      return Eval(node.Expression, env);
    case (node instanceof IntegerLiteral):
      return new Integer(node.Value);
    case (node instanceof BooleanLiteral):
      return nativeBoolToBoolObject(node.Value);
    case (node instanceof HashLiteral):
      return EvalHashLiteral(node, env);
    case (node instanceof IfExpression):
      return EvalIfExpression(node, env);
    case (node instanceof BlockStatement):
      return EvalBlockStatement(node, env);
    case (node instanceof IndexExpression):
      left = Eval(node.Left, env);
      if (isError(left)) {
        return left;
      }
      const index = Eval(node.Index, env);
      if (isError(index)) {
        return index;
      }
      return EvalIndexExpression(left, index);
    case (node instanceof ArrayLiteral):
      const elements = EvalExpression(node.Elements, env);
      if (elements.length === 1 && isError(elements[0])) {
        return elements[0];
      }
      return new ArrayObj(elements);
    case (node instanceof ReturnStatement):
      const value = Eval(node.ReturnValue, env);
      if (isError(value)) {
        return value
      }
      return new ReturnValue(value);
    case (node instanceof FunctionLiteral):
      const params = node.Params;
      const body = node.Body;
      return new Function(params, body, env);
    case (node instanceof PrefixExpression):
      right = Eval(node.Right, env);
      if (isError(right)) {
        return right;
      };
      return EvalPrefixExpression(node.Operator, right);
    case (node instanceof InfixExpression):
      right = Eval(node.Right, env);
      left = Eval(node.Left, env);
      if (isError(right)) {
        return right
      } else if (isError(left)) {
        return left
      };
      return EvalInfixExpression(node.Operator, left, right);
    case (node instanceof LetStatement):
      const val = Eval(node.Value, env);
      if (isError(val)) {
        return val;
      }
      env.set(node.Identifier.Name, val);
      return OBJ.NULL;
    case (node instanceof FunctionCallExpression):
      const func = Eval(node.Function, env);
      if (isError(func)) {
        return func;
      }
      const args = EvalExpression(node.Arguments, env)
      if (args.length === 1 && isError(args[0])) {
        return args[0];
      }
      return applyFunction(func, args);
    default:
      return OBJ.NULL;
  }
}

function applyFunction(func: Object, args: Object[]) {
  switch (func.Type()) {
    case "FUNCTION":
      const fn = func as Function;
      const extendedEnv = extendFunctionEnv(fn, args);
      const evaluated = Eval(fn.Body, extendedEnv);
      return unwrapReturnValue(evaluated);
    case "BUILTIN":
      const res = (func as Builtin).func(...args);
      return res;
    default:
      return new Error(`not a function: ${func.Type()}`);
  }

}

function EvalHashLiteral(node: HashLiteral, env: Environment): Object {
  const pairsMap = new Map<string, KeyValuePair<Hashable, Object>>();

  for (const { key: keyNode, value: valueNode } of node.Pairs) {
    const key = Eval(keyNode, env);
    if (isError(key)) {
      return key;
    }
    if (!isHashable(key)) {
      return new Error(`unusable as hash key: ${key.Type()}`);
    }
    const value = Eval(valueNode, env);
    if (isError(value)) {
      return value;
    }

    const hashableKey = key as Hashable;
    pairsMap.set(hashableKey.HashKey(), { key: hashableKey, value });
  }

  return new Hash(Array.from(pairsMap.values()));
}

function isHashable(obj: Object): boolean {
  return obj.Type() === "STRING" || obj.Type() === "INTEGER" || obj.Type() === "BOOLEAN";
}

function extendFunctionEnv(func: Function, args: Object[]) {
  const env = new Environment(func.Env);

  func.Params.map((param, idx) => {
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

function EvalIndexExpression(left: Object, index: Object) {
  switch (true) {
    case left.Type() === OBJECTS.ARRAY_OBJ && index.Type() === OBJECTS.INTEGER_OBJ:
      return EvalArrayIndexExpression(left, index);
    case left.Type() === OBJECTS.HASH_OBJ:
      return EvalHashIndexExpression(left, index);
    default:
      return new Error(`index operator not supported ${left.Type()}`);
  }
}

function EvalHashIndexExpression(hash: Object, index: Object) {
  const hashObject = hash as Hash;

  if (!isHashable(index)) {
    return new Error(`unusable as hash key: ${index.Type()}`);
  }

  const key = index as Hashable;

  const pair = hashObject.Pairs.find(p => p.key.HashKey() === key.HashKey());

  if (!pair) {
    return OBJ.NULL;
  }

  return pair.value;
}

function EvalArrayIndexExpression(left: Object, index: Object) {
  const idx = (index as Integer).Value;
  const max = (left as ArrayObj).Elements.length;

  if (idx <= 0 || idx > max) {
    return OBJ.NULL;
  }

  return (left as ArrayObj).Elements[idx - 1];
}

function EvalIdentifier(node: Identifier, env: Environment) {
  const val = env.get(node.Name);

  if (val) {
    return val;
  }

  const builtin = BUILTINS.get(node.Name);

  if (builtin) {
    return builtin;
  }

  return new Error(`Identifier not found: ${node.Name}`);
};

function EvalIfExpression(node: IfExpression, env: Environment) {
  const condition = Eval(node.Condition, env);
  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition)) {
    return Eval(node.Consequence, env);
  } else if (!node.Alternative) {
    return OBJ.NULL;
  }

  return Eval(node.Alternative, env)
};

function EvalBlockStatement(block: BlockStatement, env: Environment) {
  let res: Object;

  for (const stmt of block.statements) {
    res = Eval(stmt, env);

    if (res.Type() === "RETURN_VALUE" || res.Type() === "ERROR") {
      return res;
    }
  }

  return res;
};

function isTruthy(obj: Object) {
  switch (obj) {
    case NULL:
      return false;
    case TRUE:
      return true;
    case FALSE:
      return false
    default:
      return true;
  }
}

function EvalProgram(stmts: Statement[], env: Environment) {
  let result: Object = OBJ.NULL;

  for (const stmt of stmts) {
    result = Eval(stmt, env);

    switch (true) {
      case result instanceof ReturnValue:
        return result.Value;
      case result instanceof Error:
        return result;
    }
  }

  return result;
}

function nativeBoolToBoolObject(value: boolean) {
  if (value) {
    return OBJ.TRUE;
  }

  return OBJ.FALSE;
}

function EvalPrefixExpression(operator: string, right: Object) {
  switch (operator) {
    case "!":
      return EvalBangOperatorExpression(right);
    case "-":
      return EvalMinusPrefixOperatorExpression(right);
    default:
      return new Error(`unknown operator: ${operator}, ${right.Type()}`);
  }
}

function EvalMinusPrefixOperatorExpression(right: Object) {
  if (right.Type() != OBJECTS.INTEGER_OBJ) {
    return new Error(`unknown operator: -${right.Type()}`);
  }
  const value = (right as Integer).Value
  return new Integer(-value);
}

function EvalInfixExpression(operator: string, left: Object, right: Object) {
  switch (true) {
    case right.Type() === "INTEGER" && left.Type() === "INTEGER":
      return EvalIntegerInfixExpression(operator, left, right);
    case right.Type() === "STRING" && left.Type() === "STRING":
      return EvalStringInfixExpression(operator, left, right);
    case right.Type() !== left.Type():
      return new Error(`type mismatch: ${left.Type()} ${operator} ${right.Type()}`);
    default:
      return new Error(`unknown operator: ${left.Type()} ${operator} ${right.Type()}`);
  }
}

function EvalStringInfixExpression(operator: string, left: Object, right: Object) {
  if (operator !== "+") {
    return new Error(`unknown operator: ${left.Type()} ${operator} ${right.Type()}`);
  }

  const leftString = (left as String).Value;
  const rightString = (right as String).Value;

  return new String(leftString + rightString);

}

function EvalExpression(exps: Expression[], env: Environment) {
  let res: Object[] = [];

  for (const exp of exps) {
    const evaluated = Eval(exp, env)
    if (isError(evaluated)) {
      return [evaluated]
    }
    res.push(evaluated);
  }
  return res;
}

function EvalIntegerInfixExpression(operator: string, left: Object, right: Object) {
  const rightVal = (right as Integer).Value;
  const leftVal = (left as Integer).Value;
  switch (operator) {
    case "+":
      return new Integer(leftVal + rightVal);
    case "-":
      return new Integer(leftVal - rightVal);
    case "*":
      return new Integer(leftVal * rightVal);
    case "/":
      return new Integer(leftVal / rightVal);
    case "<":
      return nativeBoolToBoolObject(leftVal < rightVal);
    case ">":
      return nativeBoolToBoolObject(leftVal > rightVal);
    case "==":
      return nativeBoolToBoolObject(leftVal == rightVal);
    case "!=":
      return nativeBoolToBoolObject(leftVal != rightVal);
    default:
      return OBJ.NULL;
  }
}

function EvalBangOperatorExpression(right: Object) {
  switch (right) {
    case TRUE:
      return OBJ.FALSE;
    case FALSE:
      return OBJ.TRUE
    case NULL:
      return OBJ.FALSE
    default:
      return OBJ.FALSE;
  }
}

function isError(obj: Object) {
  return obj.Type() === "ERROR";
}

