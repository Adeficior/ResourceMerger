import type { Acceptable } from "@adeficior/pack-resolver";

export interface MergeStrategy {
  merge(previous: Acceptable, next: Acceptable): Acceptable;
}

export abstract class SerializeredMerger<T> implements MergeStrategy {
  abstract decode(encoded: Acceptable): T;

  abstract encode(encoded: T): Acceptable;

  abstract mergeData(previous: T, next: T): T;

  merge(previous: Acceptable, next: Acceptable): Acceptable {
    return this.encode(
      this.mergeData(this.decode(previous), this.decode(next)),
    );
  }
}
