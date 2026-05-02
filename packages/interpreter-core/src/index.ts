export { Lexer } from "./lexer/lexer";
export { TOKENS, type Token, type TokenType } from "./lexer/token";

export { Parser, type ParseError } from "./parser/parser";
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
} from "./parser/ast";

export { IntegerLiteral } from "./parser/nodes/IntegerLiteral";
export { StringLiteral } from "./parser/nodes/StringLiteral";
export { ArrayLiteral } from "./parser/nodes/ArrayLiteral";
export { BooleanLiteral } from "./parser/nodes/BooleanExpression";
export { IfExpression, BlockStatement } from "./parser/nodes/IfExpression";
export { FunctionLiteral } from "./parser/nodes/FunctionLiteral";
export { FunctionCallExpression } from "./parser/nodes/CallExpression";
export { InfixExpression } from "./parser/nodes/InfixExpression";
export { IndexExpression } from "./parser/nodes/IndexExpression";

export { Eval } from "./evaluator/evaluator";
export { Environment } from "./evaluator/objects/environment";
export { type Object, OBJECTS, CONSTANT_OBJECTS } from "./evaluator/objects/object";
export { ReturnValue } from "./evaluator/objects/return";
export { Integer } from "./evaluator/objects/integer";
export { String } from "./evaluator/objects/string";
export { Boolean } from "./evaluator/objects/boolean";
export { Null } from "./evaluator/objects/null";
export { Array as InterpreterArray } from "./evaluator/objects/array";
export { Error as InterpreterError } from "./evaluator/objects/error";
export { Function } from "./evaluator/objects/function";
export { Builtin, BUILTIN_FUCTIONS } from "./evaluator/objects/builtin";