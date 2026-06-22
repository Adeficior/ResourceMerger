import {
  silentLogger,
  type Options as ResolverOptions,
} from "@adeficior/pack-resolver";
import arg from "arg";
import type { Section } from "command-line-usage";
import commandLineUsage from "command-line-usage";
import { existsSync, readFileSync } from "fs";
import type Options from "../options.js";

const sections: Section[] = [
  {
    header: "Resource Merger",
    content: "Merge multiple resource & datapack into single archive files",
  },
  {
    header: "Options",
    optionList: [
      {
        name: "config",
        alias: "c",
        defaultValue: ".mergerrc",
        description: "The to read additional options from",
      },
      {
        name: "exclude",
        type: [String],
        multiple: true,
        description:
          "Exclude patterns. Will be ignored if {italic --include} is used",
      },
      {
        name: "include",
        type: [String],
        multiple: true,
        description:
          "Include patterns. if used, {italic --exclude} patterns will be ignored",
      },
      {
        name: "overwrite",
        type: Boolean,
        defaultValue: false,
        description: "Overwrite already existing files",
      },
      {
        name: "keep",
        type: Boolean,
        defaultValue: "opposite of {italic overwrite}",
        description: "Do not empty output folder first",
      },
      {
        name: "silent",
        type: Boolean,
        defaultValue: true,
        description: "Log info",
      },
      {
        name: "from",
        defaultValue: "./resources",
        typeLabel: "{underline directory}",
        description: "The folder to look in for datapacks & resourcepacks",
      },
      {
        name: "output",
        defaultValue: "merged.zip",
        typeLabel: "{underline file}",
        description: "The path of the output archive file",
      },
      {
        name: "pack-format",
        defaultValue: "9",
        type: Number,
        description:
          "The {italic pack_format} value written to the generated {italic pack.mcmeta}",
      },
      {
        name: "help",
        alias: "h",
        type: Boolean,
        description: "Print this usage guide.",
      },
    ],
  },
];

export interface CliOptions extends Options, Omit<ResolverOptions, "from"> {
  from: string;
}

export function readConfig(configFile?: string) {
  const file = configFile ?? ".mergerrc";
  if (existsSync(file)) {
    const buffer = readFileSync(file);
    return JSON.parse(buffer.toString()) as Partial<CliOptions>;
  }
  return null;
}

export default function getOptions(configFile?: string): CliOptions {
  const args = arg({
    "--config": String,
    "--include": String,
    "--exclude": String,
    "--from": String,
    "--output": String,
    "--pack-format": Number,
    "--overwrite": Boolean,
    "--keep": Boolean,
    "--silent": Boolean,
    "-c": "--config",
    "--help": Boolean,
    "-h": "--help",
  });

  if (args["--help"]) {
    const usage = commandLineUsage(sections);
    // eslint-disable-next-line no-console
    console.log(usage);
    process.exit(0);
  }

  const config = readConfig(configFile ?? args["--config"]);
  const output = args["--output"] ?? config?.output ?? "merged.zip";
  const silent = args["--silent"];
  const logger = silent ? silentLogger() : undefined;

  return {
    from: args["--from"] ?? config?.from ?? "resources",
    include: args["--include"] ?? config?.include,
    exclude: args["--exclude"] ?? config?.include,
    title: "Merged",
    overwrite: args["--overwrite"],
    keep: args["--keep"],
    logger,
    packFormat: args["--pack-format"] ?? config?.packFormat,
    output,
  };
}
