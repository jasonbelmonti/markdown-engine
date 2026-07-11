import { readFileSync } from "node:fs";

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { describe, expect, it } from "vitest";

import { annotatedProfileFailures } from "../scripts/declarative-validation-agent-guide-checks.mjs";

const guideFile =
  "docs/guides/declarative-validation-agent-interpretation.md";
const profileFile =
  "fixtures/declarative-validation/examples/operational-spec/profile.yaml";
const guideMarkdown = readFileSync(
  new URL(
    "../docs/guides/declarative-validation-agent-interpretation.md",
    import.meta.url,
  ),
  "utf8",
);
const profileYaml = readFileSync(
  new URL(
    "../fixtures/declarative-validation/examples/operational-spec/profile.yaml",
    import.meta.url,
  ),
  "utf8",
);

describe("declarative validation agent-guide checks", () => {
  it("accepts the shipped profile and its complete annotations", () => {
    expect(annotationFailures()).toEqual([]);
  });

  it("accepts order-independent YAML object keys", () => {
    const reorderedProfileYaml = stringifyYaml(
      reverseObjectKeys(parseYaml(profileYaml)),
    );

    expect(annotationFailures({ profileYaml: reorderedProfileYaml })).toEqual(
      [],
    );
  });

  it("rejects duplicate annotation headings", () => {
    const heading = "### 3. `objective.text`";
    const duplicatedGuide = guideMarkdown.replace(
      heading,
      `${heading}\n\n${heading}`,
    );

    expect(annotationFailures({ guideMarkdown: duplicatedGuide })).toContain(
      `${guideFile}: duplicate annotation heading ${heading}`,
    );
  });

  it("rejects a duplicate annotated-profile section", () => {
    const duplicatedGuide = `${guideMarkdown}\n\n## Annotated shipped profile\n\nDuplicate section.`;

    expect(annotationFailures({ guideMarkdown: duplicatedGuide })).toContain(
      `${guideFile}: duplicate section heading ## Annotated shipped profile`,
    );
  });

  it("rejects hollow annotation prose even when generic clauses remain", () => {
    const hollowGuide = replaceMarkdownSectionBody(
      guideMarkdown,
      "### 3. `objective.text`",
      [
        "Select some matching targets and assert the configured requirement.",
        "Failure means that either selection or assertion evaluation did not",
        "satisfy this deliberately generic explanation, which is long enough",
        "to pass a character-count check but contains no concrete semantics.",
      ].join(" "),
    );
    const failures = annotationFailures({ guideMarkdown: hollowGuide });

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('missing semantic literal "Objective"'),
        expect.stringContaining('missing semantic literal "Mission control"'),
      ]),
    );
  });

  it("rejects a natural-language semantic substitution", () => {
    const substitutedGuide = guideMarkdown.replace(
      "literal `Mission control`",
      "literal `Mission launch`",
    );

    expect(annotationFailures({ guideMarkdown: substitutedGuide })).toContain(
      `${guideFile}: annotation ### 3. \`objective.text\` missing semantic literal "Mission control"`,
    );
  });

  it.each([
    {
      name: "selector equality",
      from: "title exactly equals `Objective`",
      to: "title does not equal `Objective`",
      expectedClaim: "exact Objective title",
    },
    {
      name: "strict section order",
      from: "to occur in that order",
      to: "to occur in any order",
      expectedClaim: "strict heading order",
    },
    {
      name: "inclusive length bounds",
      from: "to be between 80 and 180 inclusive",
      to: "to be outside 80 and 180",
      expectedClaim: "inclusive 80 to 180 bounds",
    },
    {
      name: "exact URL matching",
      from: "URL exactly equals `./handoff-packet.md`",
      to: "URL does not equal `./handoff-packet.md`",
      expectedClaim: "exact handoff URL",
    },
  ])("rejects meaning-reversing $name prose", ({ from, to, expectedClaim }) => {
    const reversedGuide = guideMarkdown.replace(from, to);

    expect(reversedGuide).not.toBe(guideMarkdown);
    expect(annotationFailures({ guideMarkdown: reversedGuide })).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`missing semantic claim ${expectedClaim}`),
      ]),
    );
  });

  it.each([
    {
      name: "required frontmatter fields",
      heading: "### 1. `frontmatter.required`",
      from: "Require own top-level frontmatter fields named",
      to: "Do not require own top-level frontmatter fields named",
      expectedClaim: "affirmative required-fields assertion",
    },
    {
      name: "required sections",
      heading: "### 2. `sections.required`",
      from: "Select the document. Require `Objective`",
      to: "Select the document. Do not require `Objective`",
      expectedClaim: "affirmative required-sections assertion",
    },
    {
      name: "objective text containment",
      heading: "### 3. `objective.text`",
      from: "normalized text to contain the literal `Mission control`",
      to: "normalized text not to contain the literal `Mission control`",
      expectedClaim: "affirmative objective-text assertion",
    },
    {
      name: "objective length bounds",
      heading: "### 4. `objective.length`",
      from: "normalized text length to be between 80 and 180 inclusive",
      to: "normalized text length not to be between 80 and 180 inclusive",
      expectedClaim: "affirmative objective-length assertion",
    },
    {
      name: "heading text containment",
      heading: "### 5. `risk.heading.text`",
      from: "selected heading's text to contain `Risk Register`",
      to: "selected heading's text not to contain `Risk Register`",
      expectedClaim: "affirmative heading-text assertion",
    },
    {
      name: "required table columns",
      heading: "### 6. `risk.table.columns`",
      from: "contain columns with those names",
      to: "not contain columns with those names",
      expectedClaim: "affirmative required-columns assertion",
    },
    {
      name: "ID uniqueness",
      heading: "### 7. `risk.ids.unique`",
      from: "cells to be unique",
      to: "cells not to be unique",
      expectedClaim: "affirmative uniqueness assertion",
    },
    {
      name: "tracked-row text containment",
      heading: "### 8. `tracked.risk.row`",
      from: "selected row's normalized text to contain `OPS-RISK-1`",
      to: "selected row's normalized text not to contain `OPS-RISK-1`",
      expectedClaim: "affirmative row-text assertion",
    },
    {
      name: "exact occurrence count",
      heading: "### 9. `execution.must.count`",
      from: "every selected section to contain exactly two non-overlapping literal",
      to: "every selected section not to contain exactly two non-overlapping literal",
      expectedClaim: "affirmative occurrence-count assertion",
    },
    {
      name: "list text containment",
      heading: "### 10. `execution.list`",
      from: "selected\nlist's normalized text to contain `Validate profile`",
      to: "selected\nlist's normalized text not to contain `Validate profile`",
      expectedClaim: "affirmative list-text assertion",
    },
    {
      name: "paragraph text containment",
      heading: "### 11. `handoff.paragraph`",
      from: "selected span also to contain\n`follow-up`",
      to: "selected span also not to contain\n`follow-up`",
      expectedClaim: "affirmative paragraph-text assertion",
    },
    {
      name: "link existence",
      heading: "### 12. `handoff.link`",
      from: "Assert\nthat at least one such link exists",
      to: "Do not assert\nthat at least one such link exists",
      expectedClaim: "affirmative exists assertion",
    },
  ])(
    "rejects negated $name assertion while preserving semantic keywords",
    ({ heading, from, to, expectedClaim }) => {
      const reversedGuide = guideMarkdown.replace(from, to);

      expect(reversedGuide).not.toBe(guideMarkdown);
      expect(annotationFailures({ guideMarkdown: reversedGuide })).toEqual(
        expect.arrayContaining([
          `${guideFile}: annotation ${heading} missing semantic claim ${expectedClaim}`,
        ]),
      );
    },
  );

  it("rejects the reproduced required-fields suffix reversal", () => {
    const reversedGuide = guideMarkdown.replace(
      [
        "Require own top-level frontmatter fields named `title`,",
        "`owner`, and `status`. Failure means at least one field is absent",
      ].join("\n"),
      [
        "Require own top-level frontmatter fields named `title`,",
        "`owner`, and `status` to be absent. Failure means at least one field is present",
      ].join("\n"),
    );

    expect(reversedGuide).not.toBe(guideMarkdown);
    expect(annotationFailures({ guideMarkdown: reversedGuide })).toEqual(
      expect.arrayContaining([
        `${guideFile}: annotation ### 1. \`frontmatter.required\` does not match canonical semantic text`,
        `${guideFile}: annotation ### 1. \`frontmatter.required\` missing semantic claim affirmative required-fields assertion`,
        `${guideFile}: annotation ### 1. \`frontmatter.required\` missing semantic claim required-fields failure meaning`,
      ]),
    );
  });

  it("rejects contradictory prose appended after valid semantic sentences", () => {
    const contradictedGuide = replaceInAnnotation(
      guideMarkdown,
      "### 1. `frontmatter.required`",
      "The document selector itself is never empty.",
      [
        "The document selector itself is never empty.",
        "The required fields must nevertheless be absent.",
      ].join(" "),
    );

    expect(contradictedGuide).not.toBe(guideMarkdown);
    expect(annotationFailures({ guideMarkdown: contradictedGuide })).toContain(
      `${guideFile}: annotation ### 1. \`frontmatter.required\` does not match canonical semantic text`,
    );
  });

  it.each([
    {
      name: "required-fields absence",
      heading: "### 1. `frontmatter.required`",
      from: "Failure means at least one field is absent",
      to: "Failure does not mean at least one field is absent",
      expectedClaim: "required-fields failure meaning",
    },
    {
      name: "required-sections absence or order",
      heading: "### 2. `sections.required`",
      from: "Failure means a required heading is missing",
      to: "Failure does not mean a required heading is missing",
      expectedClaim: "required-sections failure meaning",
    },
    {
      name: "objective-text empty selection",
      heading: "### 3. `objective.text`",
      from: "No exact-title section means empty selection",
      to: "No exact-title section does not mean empty selection",
      expectedClaim: "objective-text failure meaning",
    },
    {
      name: "objective-length empty selection",
      heading: "### 4. `objective.length`",
      from: "No exact-title section means empty selection",
      to: "No exact-title section does not mean empty selection",
      expectedClaim: "objective-length failure meaning",
    },
    {
      name: "heading empty selection",
      heading: "### 5. `risk.heading.text`",
      from: "an empty selection when no such heading exists",
      to: "not an empty selection when no such heading exists",
      expectedClaim: "heading-text empty-selection meaning",
    },
    {
      name: "table empty selection",
      heading: "### 6. `risk.table.columns`",
      from: "failure is empty selection",
      to: "failure is not empty selection",
      expectedClaim: "required-columns empty-selection meaning",
    },
    {
      name: "ID empty selection or duplicate",
      heading: "### 7. `risk.ids.unique`",
      from: "Failure means no cells were selected",
      to: "Failure does not mean no cells were selected",
      expectedClaim: "ID uniqueness failure meaning",
    },
    {
      name: "tracked-row empty selection",
      heading: "### 8. `tracked.risk.row`",
      from: "qualifying row means empty selection",
      to: "qualifying row does not mean empty selection",
      expectedClaim: "tracked-row failure meaning",
    },
    {
      name: "occurrence-count empty selection",
      heading: "### 9. `execution.must.count`",
      from: "No matching section means empty selection",
      to: "No matching section does not mean empty selection",
      expectedClaim: "occurrence-count failure meaning",
    },
    {
      name: "list empty selection",
      heading: "### 10. `execution.list`",
      from: "No unordered list means empty selection",
      to: "No unordered list does not mean empty selection",
      expectedClaim: "list-text failure meaning",
    },
    {
      name: "paragraph empty selection",
      heading: "### 11. `handoff.paragraph`",
      from: "No qualifying span means empty selection",
      to: "No qualifying span does not mean empty selection",
      expectedClaim: "paragraph-text failure meaning",
    },
    {
      name: "link empty selection",
      heading: "### 12. `handoff.link`",
      from: "Failure means empty selection",
      to: "Failure does not mean empty selection",
      expectedClaim: "link empty-selection meaning",
    },
  ])(
    "rejects reversed $name failure polarity",
    ({ heading, from, to, expectedClaim }) => {
      const reversedGuide = replaceInAnnotation(
        guideMarkdown,
        heading,
        from,
        to,
      );

      expect(reversedGuide).not.toBe(guideMarkdown);
      expect(annotationFailures({ guideMarkdown: reversedGuide })).toEqual(
        expect.arrayContaining([
          `${guideFile}: annotation ${heading} missing semantic claim ${expectedClaim}`,
        ]),
      );
    },
  );

  it("rejects fixture-value drift from the bound annotation contract", () => {
    const driftedProfile = parseYaml(profileYaml);
    const frontmatterRule = driftedProfile.rules.find(
      (rule: { id?: unknown }) => rule.id === "frontmatter.required",
    );
    frontmatterRule.assert.frontmatterRequired.fields[0] = "headline";

    expect(
      annotationFailures({ profileYaml: stringifyYaml(driftedProfile) }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "fixture rule 1 semantics drifted from annotation ### 1. `frontmatter.required`",
        ),
      ]),
    );
  });
});

function annotationFailures(
  overrides: { guideMarkdown?: string; profileYaml?: string } = {},
): string[] {
  return annotatedProfileFailures({
    guideFile,
    guideMarkdown: overrides.guideMarkdown ?? guideMarkdown,
    profileFile,
    profileYaml: overrides.profileYaml ?? profileYaml,
  });
}

function reverseObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reverseObjectKeys);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([key, item]) => [key, reverseObjectKeys(item)]),
    );
  }

  return value;
}

function replaceMarkdownSectionBody(
  markdown: string,
  heading: string,
  replacement: string,
): string {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trimEnd() === heading);
  const headingMatch = /^(#{1,6})\s/.exec(heading);

  if (headingIndex === -1 || headingMatch === null) {
    throw new Error(`Missing test heading ${heading}`);
  }

  const headingLevel = headingMatch[1].length;
  let endIndex = lines.length;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const nextHeading = /^(#{1,6})\s/.exec(lines[index]);
    if (nextHeading !== null && nextHeading[1].length <= headingLevel) {
      endIndex = index;
      break;
    }
  }

  return [
    ...lines.slice(0, headingIndex + 1),
    "",
    replacement,
    "",
    ...lines.slice(endIndex),
  ].join("\n");
}

function replaceInAnnotation(
  markdown: string,
  heading: string,
  from: string,
  to: string,
): string {
  const body = normalizeWhitespace(markdownSectionBody(markdown, heading));
  const replacedBody = body.replace(from, to);

  if (replacedBody === body) {
    throw new Error(`Missing annotation mutation source for ${heading}: ${from}`);
  }

  return replaceMarkdownSectionBody(markdown, heading, replacedBody);
}

function markdownSectionBody(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trimEnd() === heading);
  const headingMatch = /^(#{1,6})\s/.exec(heading);

  if (headingIndex === -1 || headingMatch === null) {
    throw new Error(`Missing test heading ${heading}`);
  }

  const headingLevel = headingMatch[1].length;
  let endIndex = lines.length;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const nextHeading = /^(#{1,6})\s/.exec(lines[index]);
    if (nextHeading !== null && nextHeading[1].length <= headingLevel) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(headingIndex + 1, endIndex).join("\n").trim();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
