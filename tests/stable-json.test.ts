import { describe, expect, it } from "vitest";

import {
  normalizeStableJsonValue,
  stringifyStableJson,
} from "../src/internal/stable-json.js";

describe("stable JSON normalization", () => {
  it("sorts record keys, drops undefined fields, and recurses through arrays", () => {
    expect(
      normalizeStableJsonValue({
        z: 1,
        missing: undefined,
        a: [{ b: undefined, a: "value" }],
      }),
    ).toEqual({
      a: [{ a: "value" }],
      z: 1,
    });
  });

  it("stringifies normalized values with the JSON null fallback", () => {
    expect(stringifyStableJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(stringifyStableJson(undefined)).toBe("null");
  });
});
