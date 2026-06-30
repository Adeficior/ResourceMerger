import { JsonMerger } from "./json.js";

const ModelMerger = new JsonMerger<unknown>((a, b) => b);

export default ModelMerger;
