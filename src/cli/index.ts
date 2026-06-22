import { createResolver } from "@adeficior/pack-resolver";
import createDefaultMergers from "../merger/default.js";
import getOptions from "./config.js";

const options = getOptions();
const resolvers = createResolver(options);
const mergers = createDefaultMergers(options);
await mergers.run(resolvers);
