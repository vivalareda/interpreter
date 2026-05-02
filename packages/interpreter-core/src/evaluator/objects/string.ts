import { OBJECTS, type Object } from "./object";

export class String implements Object {
  constructor(public Value: string) {}

  Type() {
    return OBJECTS.STRING_OBJ;
  }

  Inspect() {
    return `"${this.Value}"`;
  }
}