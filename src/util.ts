import type { Acceptable } from "@adeficior/pack-resolver";
import crypto from "node:crypto";

export function fileHash(content: Acceptable, type = "sha256") {
  return crypto.createHash(type).update(content).digest("hex");
}
