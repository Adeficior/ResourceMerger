import { describe, expect, it } from "bun:test";
import { uniq } from "../src";

describe("uniq util function", () => {
  it("filters numbers", () => {
    const unique = uniq([1, 1, 1, 1, 2, 31, 411, 2, 4, 1, 2, 3, 4]);
    expect(unique).toMatchObject([1, 2, 31, 411, 4, 3]);
  });

  it("filters strings", () => {
    const unique = uniq([
      "test string",
      "another string",
      "test string",
      "test-string",
      "whatever",
    ]);

    expect(unique).toMatchObject([
      "test string",
      "another string",
      "test-string",
      "whatever",
    ]);
  });
});
