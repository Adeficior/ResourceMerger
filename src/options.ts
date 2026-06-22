import type { Logger } from "@adeficior/pack-resolver";

export default interface Options {
  output?: string;
  title?: string;
  packFormat?: number;
  overwrite?: boolean;
  keep?: boolean;
  logger?: Logger | false;
}
