import { uniq } from "@adeficior/pack-resolver";
import { JsonMerger } from "./json.js";

export interface TagDefinition {
  replace?: boolean;
  values: Array<
    | string
    | {
        value: string;
        required?: boolean;
      }
  >;
}

const TagMerger = new JsonMerger<TagDefinition>((a, b) => {
  if (b.replace) return b;
  return {
    replace: a.replace,
    values: uniq([...a.values, ...b.values]),
  };
});

export default TagMerger;
