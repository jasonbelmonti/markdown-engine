import { describe, expect, it } from "vitest";
import {
  normalize,
  parse,
  validateWithProfile,
  type ValidationProfile,
  type DeclarativeTableColumnCoverage,
} from "../src/index.js";
import { parseValidationProfileInput } from "../src/declarative-validation/profile/index.js";

const markdown = `## Requirements

| ID | Required |
| --- | --- |
| AC-1 | **Yes** |
| AC-2 | No |

## Proof

| Evidence | Next |
| --- | --- |
| AC-1: test passed. | AC-2: run test. |
`;
const coverage: DeclarativeTableColumnCoverage = {
  source: {
    section: "Requirements",
    column: "ID",
    prefix: "AC",
    rowWhere: { column: "Required", equals: "Yes" },
  },
  target: { section: "Proof", column: "Evidence" },
  require: "everySourceId",
  allowEmptySource: true,
};
function profile(assertion: unknown): ValidationProfile {
  return {
    syntaxVersion: "markdown-engine.validation@v2",
    documentVersion: "1.0.0",
    rules: [
      {
        id: "required.coverage",
        select: { target: "document" },
        assert: {
          tableColumnCoverage: assertion as DeclarativeTableColumnCoverage,
        },
      },
    ],
  };
}
function run(
  source = markdown,
  assertion: unknown = coverage,
  locations = true,
) {
  return validateWithProfile(
    normalize(parse(source).parsed, {
      documentVersion: "1.0.0",
      preserveSourceLocations: locations,
    }).document,
    profile(assertion),
  );
}

describe("opt-in filtered table column coverage", () => {
  it("covers only IDs whose sibling matches normalized text", () => {
    expect(run()).toMatchObject({ valid: true, diagnostics: [] });
    expect(
      run(markdown, {
        ...coverage,
        source: {
          ...coverage.source,
          rowWhere: { column: "Required", includes: "Y" },
        },
      }).valid,
    ).toBe(true);
  });
  it("does not count references in another column", () => {
    const result = run(markdown.replace("AC-1: test passed.", "Test passed."));
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "required.coverage",
          code: "profile.validation.tableColumnCoverageIdMissing",
          message: expect.stringContaining('"Evidence"'),
        }),
      ]),
    );
  });
  it("keeps unfiltered coverage and empty-source defaults unchanged", () => {
    const { rowWhere: _filter, ...source } = coverage.source;
    const { allowEmptySource: _policy, ...assertion } = coverage;
    expect(run(markdown, { ...coverage, source }).valid).toBe(false);
    expect(run(markdown.replace("**Yes**", "No"), assertion).valid).toBe(false);
    expect(
      run(markdown.replace("**Yes**", "No"), {
        ...coverage,
        allowEmptySource: false,
      }).valid,
    ).toBe(false);
    expect(run(markdown.replace("**Yes**", "No")).valid).toBe(true);
  });
  it.each(["Missing", "Requirements"])(
    "does not allow unresolved source columns or sections (%s)",
    (section) => {
      expect(
        run(markdown, {
          ...coverage,
          source: { ...coverage.source, section, column: "Missing" },
        }).valid,
      ).toBe(false);
    },
  );
  it("does not treat a missing predicate column as an empty resolved source", () => {
    expect(
      run(markdown, {
        ...coverage,
        source: {
          ...coverage.source,
          rowWhere: { column: "Missing", equals: "Yes" },
        },
      }).valid,
    ).toBe(false);
  });
  it("handles prose sources, repeated references and no IDs with an explicit policy", () => {
    const reverse = {
      ...coverage,
      source: { section: "Proof", column: "Evidence", prefix: "AC" },
      target: { section: "Requirements", column: "ID" },
    };
    expect(
      run(
        markdown.replace("AC-1: test passed.", "AC-1 and AC-1: test passed."),
        reverse,
      ).valid,
    ).toBe(true);
    expect(
      run(markdown.replace("AC-1: test passed.", "None admitted."), reverse)
        .valid,
    ).toBe(true);
    expect(
      run(markdown.replace("AC-1: test passed.", "AC-9: test passed."), reverse)
        .valid,
    ).toBe(false);
  });
  it("retains actionable diagnostics without source ranges", () => {
    const result = run(
      markdown.replace("AC-1: test passed.", "Nothing admitted."),
      coverage,
      false,
    );
    expect(result.diagnostics[0]).toMatchObject({
      ruleId: "required.coverage",
      message: expect.stringContaining("AC-1"),
    });
  });
  it.each([
    { ...coverage, allowEmptySource: "true" },
    { ...coverage, source: { ...coverage.source, rowWhere: {} } },
    {
      ...coverage,
      source: {
        ...coverage.source,
        rowWhere: { column: "Required", equals: "" },
      },
    },
    {
      ...coverage,
      source: {
        ...coverage.source,
        rowWhere: { column: "Required", equals: 1 },
      },
    },
    {
      ...coverage,
      source: {
        ...coverage.source,
        rowWhere: { column: "Required", equals: "Yes", unknown: true },
      },
    },
  ])(
    "rejects malformed policy/filter for file and typed profiles",
    (assertion) => {
      const input = profile(assertion);
      expect(
        parseValidationProfileInput(JSON.stringify(input)).diagnostics.length,
      ).toBeGreaterThan(0);
      expect(run(markdown, assertion).valid).toBe(false);
    },
  );
  it("preserves options across file parsing and compilation", () => {
    const result = parseValidationProfileInput(
      JSON.stringify(profile(coverage)),
    );
    expect(result.diagnostics).toEqual([]);
    expect(result.profile).toEqual(profile(coverage));
    expect(
      validateWithProfile(
        normalize(parse(markdown).parsed, { documentVersion: "1.0.0" })
          .document,
        result.profile!,
      ).valid,
    ).toBe(true);
  });
});
