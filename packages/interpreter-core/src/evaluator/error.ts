import { type Object, OBJECTS } from "./object.js";

export class Error implements Object {
  constructor(
    public Message: string,
  ) { }

  Type() {
    return OBJECTS.ERROR_OBJ;
  }

  Inspect() {
    return `Error: ${this.Message}`;
  }
}
