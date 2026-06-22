import type { Acceptable } from "@adeficior/pack-resolver";
import crypto from "node:crypto";
import { mkdtempSync, readdir, rmdirSync, unlink } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function fileHash(content: Acceptable, type = "sha256") {
  return crypto.createHash(type).update(content).digest("hex");
}

export function createTempDir() {
  const name = mkdtempSync(join(tmpdir(), "merger-"));
  const removeCallback = () => rmdirSync(name);
  return { name, removeCallback };
}

export function uniq<T>(values: T[]) {
  return values.filter((a, ia) => !values.some((b, ib) => ib < ia && a === b));
}

export function emptyDirSync(directory: string) {
  readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      unlink(join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
}
