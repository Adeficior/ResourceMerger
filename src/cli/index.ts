import {
  createAcceptor,
  createCombinedResolver,
} from "@adeficior/pack-resolver";
import getOptions from "./config.js";

const options = getOptions();
const resolver = createCombinedResolver(options);
const acceptor = createAcceptor(options.output);

await resolver.extract(acceptor);
