import { type Hashable, type Object, OBJECTS } from "./object.js";

export class String implements Object, Hashable {
  constructor(
    public Value: string
  ) { };

  Type() {
    return OBJECTS.STRING_OBJ;
  }

  Inspect(): string {
    return this.Value;
  }

  HashKey() {
    return `STRING_${this.Value}`;
  }

}
