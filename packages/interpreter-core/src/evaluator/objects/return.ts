import { OBJECTS, type Object } from "./object";

export class ReturnValue {
  constructor(public Value: Object) {}

  Type() {
    return OBJECTS.RETURN_VALUE_OBJ;
  }

  Inspect() {
    return this.Value.toString();
  }
}