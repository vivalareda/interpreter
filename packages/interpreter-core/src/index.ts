// Lexer exports
export { Lexer } from "./lexer/lexer.js";
export { TOKENS, type Token, type TokenType } from "./lexer/token.js";

// Parser exports
export { Parser } from "./parser/parser.js";
export {
  Program,
  Identifier,
  ExpressionStatement,
  LetStatement,
  ReturnStatement,
  PrefixExpression,
  type Node,
  type Statement,
  type Expression,
} from "./parser/ast.js";

// Parser node exports
export { IntegerLiteral } from "./parser/nodes/IntegerLiteral.js";
export { StringLiteral } from "./parser/nodes/StringLiteral.js";
export { ArrayLiteral } from "./parser/nodes/ArrayLiteral.js";
export { HashLiteral, type KeyValuePair } from "./parser/nodes/HashLiteral.js";
export { BooleanLiteral } from "./parser/nodes/BooleanExpression.js";
export { IfExpression, BlockStatement } from "./parser/nodes/IfExpression.js";
export { FunctionLiteral } from "./parser/nodes/FunctionLiteral.js";
export { FunctionCallExpression } from "./parser/nodes/CallExpression.js";
export { InfixExpression } from "./parser/nodes/InfixExpression.js";
export { IndexExpression } from "./parser/nodes/IndexExpression.js";

// Evaluator exports
export { Eval, OBJ } from "./evaluator/evaluator.js";
export { Environment } from "./evaluator/environment.js";
export { type Object, OBJECTS, type Hashable, ReturnValue } from "./evaluator/object.js";
export { Integer } from "./evaluator/integer.js";
export { String } from "./evaluator/string.js";
export { Boolean } from "./evaluator/boolean.js";
export { Null } from "./evaluator/null.js";
export { Array as InterpreterArray } from "./evaluator/array.js";
export { Hash } from "./evaluator/hash.js";
export { Error as InterpreterError } from "./evaluator/error.js";
export { Function } from "./evaluator/function.js";
export { Builtin, BUILTINS } from "./evaluator/builtin.js";
