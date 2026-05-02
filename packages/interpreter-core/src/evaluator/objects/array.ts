import { OBJECTS, type Object } from "./object";

export class Array implements Object {
  constructor(public Elements: Object[]) {}

  Type() {
    return OBJECTS.ARRAY_OBJ;
  }

  Inspect() {
    return this.Elements.map((v) => v.Inspect()).join(", ");
  }
}