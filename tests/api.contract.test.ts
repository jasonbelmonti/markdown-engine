import { describe, expect, it } from "vitest";

import { normalize, parse, serialize, validate } from "markdown-engine";

describe("public API", () => {
  it("exports the named API functions", () => {
    expect(parse).toEqual(expect.any(Function));
    expect(normalize).toEqual(expect.any(Function));
    expect(validate).toEqual(expect.any(Function));
    expect(serialize).toEqual(expect.any(Function));
  });
});
