import { OBJECTS, type Object } from "./object.js";

export class Array implements Object {
  expressionNode = true as const;

  constructor(
    public Elements: Object[]
  ) { }

  Type() {
    return OBJECTS.ARRAY_OBJ;
  }

  Inspect() {
    return `[${this.Elements.map((el) => el.toString()).join(", ")}]`
  }

}
