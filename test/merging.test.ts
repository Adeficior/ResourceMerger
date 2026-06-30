import { combineResolvers } from "@adeficior/pack-resolver";
import {
  createTestAcceptor,
  createTestResolver,
} from "@adeficior/pack-resolver/testing";
import { describe, expect, it } from "bun:test";
import { createMergingAcceptor } from "../src";

describe("merging strategies", () => {
  it("merges tags correctly", async () => {
    const tagPath = "data/example/tags/items/orbs.json";

    const resolver = combineResolvers([
      createTestResolver({
        [tagPath]: JSON.stringify({
          values: ["example:circle", "example:oval"],
        }),
      }),
      createTestResolver({
        [tagPath]: JSON.stringify({
          values: ["example:sphere"],
        }),
      }),
    ]);

    const acceptor = createTestAcceptor();

    await resolver.extract(createMergingAcceptor(acceptor));

    expect(acceptor.jsonAt(tagPath)).toMatchSnapshot("orbs.json");
    expect(acceptor.finalize).toBeCalledTimes(1);
  });

  it("replaces tags correctly", async () => {
    const tagPath = "data/example/tags/items/orbs.json";

    const resolver = combineResolvers([
      createTestResolver({
        [tagPath]: JSON.stringify({
          replace: true,
          values: ["example:circle", "example:oval"],
        }),
      }),
      createTestResolver({
        [tagPath]: JSON.stringify({
          replace: true,
          values: ["example:sphere"],
        }),
      }),
    ]);

    const acceptor = createTestAcceptor();

    await resolver.extract(createMergingAcceptor(acceptor));

    expect(acceptor.jsonAt(tagPath)).toMatchSnapshot("replaced orbs.json");
    expect(acceptor.finalize).toBeCalledTimes(1);
  });
});
