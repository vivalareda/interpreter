import { OBJECTS, type Hashable, type Object } from "./object.js";

export class Boolean implements Object, Hashable {
  constructor(
    public Value: boolean,
  ) { };

  Inspect() {
    return this.Value.toString();
  }

  Type() {
    return OBJECTS.BOOLEAN_OBJ;
  }

  HashKey() {
    return `BOOLEAN_${this.Value}`
  }
}
