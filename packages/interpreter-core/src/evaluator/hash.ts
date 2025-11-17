import { type Hashable, type Object, OBJECTS } from "./object.js";
import { type KeyValuePair } from "../parser/nodes/HashLiteral.js";

export class Hash implements Object {

  constructor(
    public Pairs: Array<KeyValuePair<Hashable, Object>>
  ) { }

  Type() {
    return OBJECTS.HASH_OBJ;
  }

  Inspect() {
    const pairs = this.Pairs.map(({ key, value }) => {
      return `${key.Inspect()}: ${value.Inspect()}`;
    }).join(", ");

    return `{${pairs}}`;
  }
}
