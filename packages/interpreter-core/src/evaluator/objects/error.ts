import { OBJECTS, type Object } from "./object";

export class Error implements Object {
  constructor(
    public Message: string,
    public Snippet?: string,
  ) {}

  Type() {
    return OBJECTS.ERROR_OBJ;
  }

  Inspect() {
    return this.Snippet
      ? `ERROR ${this.Snippet}: ${this.Message}`
      : `ERROR ${this.Message}`;
  }
}