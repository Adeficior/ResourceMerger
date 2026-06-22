import { JsonMerger } from "./index.js";

export type LangDefinition = Record<string, string>;

const LangMerger = new JsonMerger<LangDefinition>((a, b) => {
  return { ...a, ...b };
});

export default LangMerger;
