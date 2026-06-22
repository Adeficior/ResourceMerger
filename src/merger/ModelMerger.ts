import { JsonMerger } from "./index.js";

const ModelMerger = new JsonMerger<unknown>((a, b) => b);

export default ModelMerger;
