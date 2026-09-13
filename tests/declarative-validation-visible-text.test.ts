import { describe, expect, it } from "vitest";
import {
  normalize,
  parse,
  validateWithProfile,
  type ValidationProfile,
  type DeclarativeSelector,
} from "../src/index.js";
import { parseValidationProfileInput } from "../src/declarative-validation/profile/index.js";

function profile(text: unknown = { nonBlank: true }): ValidationProfile {
  return {
    syntaxVersion: "markdown-engine.validation@v2",
    documentVersion: "1.0.0",
    rules: [
      {
        id: "field.nonblank",
        select: { target: "tableCell", section: "Record", column: "Field" },
        assert: { text: text as { nonBlank: true } },
      },
    ],
  };
}
function run(cell: string, input = profile(), locations = true) {
  const document = normalize(
    parse(`## Record\n\n| Field |\n| --- |\n| ${cell} |`).parsed,
    { documentVersion: "1.0.0", preserveSourceLocations: locations },
  ).document;
  return validateWithProfile(document, input);
}

describe("opt-in text.nonBlank", () => {
  it.each([
    "",
    " \t ",
    "<!-- hidden -->",
    "<span></span>",
    "<span> </span>",
    "&nbsp;",
    "&#32;",
    "<br>",
  ])("rejects a field without visible text: %j", (cell) => {
    expect(run(cell)).toMatchObject({
      valid: false,
      diagnostics: [
        expect.objectContaining({
          code: "profile.validation.textBlank",
          ruleId: "field.nonblank",
          message: expect.stringContaining("tableCell"),
        }),
      ],
    });
  });
  it.each([
    "None admitted.",
    "None.",
    "**Proof**",
    "[Proof](https://example.com)",
    "`<span></span>`",
    "&lt;span&gt;",
    "<span>Proof</span>",
    "<!-- hidden --> Proof",
  ])("accepts visible prose or literal code: %j", (cell) => {
    expect(run(cell)).toMatchObject({ valid: true, diagnostics: [] });
  });
  it.each([
    [{ target: "document" }, "<!-- hidden -->", "Proof"],
    [{ target: "heading" }, "## <span></span>", "## Proof"],
    [
      { target: "section" },
      "## <span></span>\n\n<!-- hidden -->",
      "## <span></span>\n\nProof",
    ],
    [
      { target: "table" },
      "| <span></span> |\n| --- |\n| <!-- hidden --> |",
      "| Proof |\n| --- |\n| Value |",
    ],
    [
      { target: "tableRow" },
      "| Field |\n| --- |\n| <!-- hidden --> |",
      "| Field |\n| --- |\n| Proof |",
    ],
    [{ target: "textSpan", nodeType: "html" }, "<!-- hidden -->", ""],
    [{ target: "list" }, "- <!-- hidden -->", "- Proof"],
    [
      { target: "link" },
      "[<span></span>](https://example.com)",
      "[Proof](https://example.com)",
    ],
  ])("evaluates structural node text for %j", (select, blank, visible) => {
    const evaluate = (source: string) =>
      validateWithProfile(
        normalize(parse(source).parsed, { documentVersion: "1.0.0" }).document,
        {
          ...profile(),
          rules: [
            {
              id: "content.nonblank",
              select: select as DeclarativeSelector,
              assert: { text: { nonBlank: true } },
            },
          ],
        },
      );
    expect(evaluate(blank).valid).toBe(false);
    if (visible) expect(evaluate(visible).valid).toBe(true);
  });
  it("works without source locations", () => {
    expect(run("<span></span>", profile(), false).valid).toBe(false);
    expect(run("`<span></span>`", profile(), false).valid).toBe(true);
  });
  it("leaves the existing literal contains semantics unchanged", () => {
    expect(run("<!-- hidden -->", profile({ contains: "hidden" })).valid).toBe(
      true,
    );
    expect(
      run("<!-- hidden -->", profile({ contains: "hidden", nonBlank: true }))
        .valid,
    ).toBe(false);
  });
  it.each([false, "true", 1, null])(
    "rejects malformed nonBlank in parsed and typed profiles (%j)",
    (nonBlank) => {
      expect(
        parseValidationProfileInput(JSON.stringify(profile({ nonBlank })))
          .diagnostics.length,
      ).toBeGreaterThan(0);
      expect(run("Proof", profile({ nonBlank })).valid).toBe(false);
    },
  );
  it("rejects the opt-in on syntax v1", () => {
    const input = {
      ...profile(),
      syntaxVersion: "markdown-engine.validation@v1",
    } as ValidationProfile;
    expect(
      parseValidationProfileInput(JSON.stringify(input)).diagnostics.length,
    ).toBeGreaterThan(0);
    expect(run("Proof", input).valid).toBe(false);
  });
});
