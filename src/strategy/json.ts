import type { Acceptable } from "@adeficior/pack-resolver";
import { SerializeredMerger } from ".";

export class JsonMerger<T> extends SerializeredMerger<T> {
  constructor(readonly mergeData: (a: T, b: T) => T) {
    super();
  }

  override decode(encoded: Acceptable): T {
    return JSON.parse(encoded.toString()) as T;
  }

  override encode(encoded: T): Acceptable {
    return JSON.stringify(encoded, null, 2);
  }
}
