import type { Object } from "./object.js";

export class Environment {
  private store: Map<string, Object>

  constructor(
    private outer?: Environment
  ) {
    this.store = new Map;
  }

  get(name: string): Object | undefined {
    return this.store.get(name) ?? this.outer?.get(name);
  }

  set(name: string, val: Object) {
    this.store.set(name, val);
  }
}
