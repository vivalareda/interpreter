import type { BlockStatement } from "../parser/nodes/IfExpression.js";
import type { Identifier } from "../parser/ast.js";
import type { Environment } from "./environment.js";
import { OBJECTS, type Object } from "./object.js";

export class Function implements Object {
  constructor(
    public Params: Identifier[],
    public Body: BlockStatement,
    public Env: Environment
  ) { }

  Type() {
    return OBJECTS.FUNCTION_OBJ;
  }

  Inspect() {
    let out = ""
    for (const param of this.Params) {
      out += param
    }
    return out;
  }
}
