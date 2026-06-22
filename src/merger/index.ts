import {
  createLogger,
  silentLogger,
  type Acceptable,
  type Acceptor,
  type IResolver,
  type Logger,
} from "@adeficior/pack-resolver";
import chalk from "chalk";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import minimatch from "minimatch";
import { dirname, extname, join } from "path";
import { zip } from "zip-a-folder";
import type Options from "../options.js";
import { createTempDir, emptyDirSync, fileHash, uniq } from "../util.js";

export interface Merger<T> {
  merge(a: T, b: T): T;
  decode(encoded: Acceptable): T;
  encode(encoded: T): Acceptable;
}

export class JsonMerger<T> implements Merger<T> {
  constructor(readonly merge: (a: T, b: T) => T) {}

  decode(encoded: Acceptable): T {
    return JSON.parse(encoded.toString()) as T;
  }

  encode(encoded: T): Acceptable {
    return JSON.stringify(encoded, null, 2);
  }
}

const createOptions = (partial: Options): Required<Options> => ({
  output: "merged.zip",
  title: "Merged",
  packFormat: 9,
  overwrite: false,
  keep: !partial.overwrite,
  logger: createLogger(),
  ...partial,
});

export class Mergers {
  private readonly outDir: string;
  private readonly options: Required<Options>;
  private readonly logger: Logger;
  private readonly zipOutput: boolean;
  private readonly cleanup?: () => void;

  constructor(
    options: Options,
    private readonly mergers: Record<string, Merger<unknown>>,
  ) {
    this.options = createOptions(options);
    this.logger =
      this.options.logger === false ? silentLogger() : this.options.logger;

    const existingOutputDir =
      existsSync(this.options.output) &&
      statSync(this.options.output).isDirectory();
    this.zipOutput =
      !existingOutputDir &&
      [".zip", ".jar"].includes(extname(this.options.output));

    if (this.zipOutput) {
      const tmp = createTempDir();
      this.outDir = tmp.name;
      this.cleanup = tmp.removeCallback;
    } else {
      this.outDir = this.options.output;
    }
  }

  private handle<T>(merger: Merger<T>, a: Acceptable, b: Acceptable) {
    const merged = merger.merge(merger.decode(a), merger.decode(b));
    return merger.encode(merged);
  }

  private merged = 0;
  private overwritten: string[] = [];

  public get mergedFiles() {
    return this.merged;
  }

  public get overwrittenFiles(): ReadonlyArray<string> {
    return uniq(this.overwritten);
  }

  exists(path: string) {
    if (this.zipOutput) return false;
    const out = join(this.outDir, path);
    return existsSync(out);
  }

  public createAcceptor(): Acceptor {
    return (path, content) => {
      const out = join(this.outDir, path);
      const cached = existsSync(out);
      if (cached && !this.options.overwrite) return;
      if (!existsSync(dirname(out))) {
        mkdirSync(dirname(out), { recursive: true });
      }

      const getContent = () => {
        if (cached) {
          const merger = Object.entries(this.mergers).find(([pattern]) =>
            minimatch(path, pattern),
          )?.[1];
          if (merger != null) {
            const existing = readFileSync(out);
            const merged = this.handle(merger, existing, content);
            this.merged++;
            return merged;
          } else {
            this.overwritten.push(path);
            return content;
          }
        } else {
          return content;
        }
      };

      writeFileSync(out, getContent());
    };
  }

  public async run(resolver: IResolver) {
    if (!this.options.keep) emptyDirSync(this.outDir);
    const acceptor = this.createAcceptor();

    this.logger.info("Extracting resources...");
    await resolver.extract(acceptor);

    await this.finalize();
  }

  public async finalize() {
    if (this.mergedFiles > 0)
      this.logger.info(chalk.gray(`Merged ${this.mergedFiles} files`));
    if (this.overwrittenFiles.length > 0) {
      const patterns = uniq(
        this.overwrittenFiles.map((path) => {
          const [base, , folder] = path.split(/[/\\]/);
          if (!folder) return path;
          return join(base!, "*", folder, "...");
        }),
      );
      this.logger.info(`Overwritten ${this.overwrittenFiles.length} files`);
      const grouped = this.logger.group();
      patterns.forEach((pattern) => {
        grouped.info(pattern);
      });
    }

    const packData = {
      pack: {
        description: `${this.options.title} - generated ${new Date().toLocaleDateString()}`,
        pack_format: this.options.packFormat,
      },
    };
    writeFileSync(
      join(this.outDir, "pack.mcmeta"),
      JSON.stringify(packData, null, 2),
    );

    if (this.zipOutput) {
      this.logger.info("Creating ZIP File...");
      await zip(this.outDir, this.options.output);

      const hash = fileHash(readFileSync(this.options.output), "sha1");
      this.logger.info(`SHA256: ${hash}`);
    }

    this.cleanup?.();
  }
}
