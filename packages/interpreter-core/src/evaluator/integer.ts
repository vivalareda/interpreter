import { type Object, type Hashable, OBJECTS } from "./object.js";

export class Integer implements Object, Hashable {
  constructor(
    public Value: number,
  ) { }

  Inspect() {
    return this.Value.toString();
  }

  Type() {
    return OBJECTS.INTEGER_OBJ;
  }

  toString(): string {
    return `${this.Value}`;
  }

  HashKey() {
    return `INTEGER_${this.Value}`;
  }
}
