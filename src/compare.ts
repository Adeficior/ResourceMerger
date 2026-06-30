import { createResolver } from "@adeficior/pack-resolver";
import chalk from "chalk";
import { existsSync } from "fs";
import { styleText } from "util";
import { fileHash } from "./util.js";

/* eslint-disable no-console */

async function compare(reference: string, generated: string) {
  if (!existsSync(reference)) throw new Error("Reference archive missing");

  const pathToHash = new Map<string, string>();
  const hashToPath = new Map<string, string>();

  await createResolver({ from: reference }).extract({
    accept: async (path, content) => {
      const hash = fileHash(await content);
      pathToHash.set(path, hash);
      hashToPath.set(hash, path);
    },
  });

  await createResolver({ from: generated }).extract({
    accept: async (path, content) => {
      const hash = fileHash(await content);
      if (pathToHash.has(path)) {
        if (hash !== pathToHash.get(path)) {
          console.info(styleText("yellow", `~ '${path}'`));
        }
        pathToHash.delete(path);
      } else {
        const oldPath = hashToPath.get(hash);
        if (oldPath) {
          console.info(styleText("blue", `~ ${oldPath} -> ${path}`));
          pathToHash.delete(oldPath);
        } else console.info(styleText("green", `+ '${path}'`));
      }
    },
  });

  for (const missing of pathToHash.keys()) {
    console.log(chalk.red(`- '${missing}'`));
  }
}

compare("reference.zip", "server-resources.zip");
