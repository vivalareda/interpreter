import { OBJECTS, type Object } from "./object.js";

export class Null implements Object {

  Inspect() {
    return "null";
  }

  Type() {
    return OBJECTS.NULL_OBJ;
  }

}
