import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  validateDocumentSet,
  type ValidateDocumentSetEntry,
  type ValidateDocumentSetEntryResult,
  type ValidateDocumentSetResult,
} from "@jasonbelmonti/markdown-engine";

type OkfDocumentRole = "concept" | "log" | "non-root-index" | "root-index";

interface OkfFailureCase {
  name: string;
  bundlePath: string;
  path: string;
  expectedDiagnostic: {
    code: string;
    ruleId: string;
    message: string;
  };
}

const okfExampleRoot = "fixtures/declarative-validation/examples/okf-v0.1";
const okfProfiles = {
  concept: `${okfExampleRoot}/profiles/concept.yaml`,
  log: `${okfExampleRoot}/profiles/log.yaml`,
  "non-root-index": `${okfExampleRoot}/profiles/non-root-index.yaml`,
  "root-index": `${okfExampleRoot}/profiles/root-index.yaml`,
} satisfies Record<OkfDocumentRole, string>;
const passBundleFiles = [
  "index.md",
  "log.md",
  "datasets/index.md",
  "datasets/sales.md",
  "playbooks/incident-response.md",
] as const;
const expectedPassBundleProfiles = {
  "index.md": okfProfiles["root-index"],
  "log.md": okfProfiles.log,
  "datasets/index.md": okfProfiles["non-root-index"],
  "datasets/sales.md": okfProfiles.concept,
  "playbooks/incident-response.md": okfProfiles.concept,
} as const;
const failureCases = [
  {
    name: "missing concept type",
    bundlePath: "fail/missing-concept-type",
    path: "concepts/customer-metric.md",
    expectedDiagnostic: {
      code: "profile.validation.frontmatterFieldMissing",
      ruleId: "okf.concept.frontmatter",
      message: 'Required frontmatter field "type" is missing.',
    },
  },
  {
    name: "forbidden non-root index frontmatter",
    bundlePath: "fail/non-root-index-frontmatter",
    path: "datasets/index.md",
    expectedDiagnostic: {
      code: "profile.validation.frontmatterForbidden",
      ruleId: "okf.non-root-index.no-frontmatter",
      message: "Frontmatter is forbidden.",
    },
  },
  {
    name: "invalid log date heading",
    bundlePath: "fail/invalid-log-date",
    path: "log.md",
    expectedDiagnostic: {
      code: "profile.validation.assertionFailed",
      ruleId: "okf.log.date-heading",
      message:
        "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
    },
  },
] satisfies readonly OkfFailureCase[];

describe("OKF v0.1 document-set examples", () => {
  it("validates the passing bundle through caller-selected public profiles", () => {
    const result = validateOkfBundle("pass", passBundleFiles);

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(profilePathsByEntryPath(result)).toEqual(expectedPassBundleProfiles);
    expect(result.entries.map((entry) => entry.path)).toEqual([
      ...passBundleFiles,
    ]);
    expect(
      result.entries.every((entry) => entry.validationResult?.valid === true),
    ).toBe(true);

    const logEntry = requireEntry(result, "log.md");
    expect(logEntry.profilePath).toBe(okfProfiles.log);
    expect(logEntry.validationDiagnostics).toEqual([]);
    expect(logEntry.validationResult?.ruleResults).toEqual([
      expect.objectContaining({
        diagnostics: [],
        passed: true,
        ruleId: "okf.log.date-heading",
      }),
    ]);

    expectEntryRuleIds(result, "index.md", [
      "okf.root-index.version-frontmatter",
    ]);
    expectEntryRuleIds(result, "datasets/index.md", [
      "okf.non-root-index.no-frontmatter",
    ]);
    expectEntryRuleIds(result, "datasets/sales.md", [
      "okf.concept.frontmatter",
    ]);
    expectEntryRuleIds(result, "playbooks/incident-response.md", [
      "okf.concept.frontmatter",
    ]);
    expect(
      result.entries
        .filter(
          (entry) => entry.path.endsWith("index.md") || entry.path === "log.md",
        )
        .flatMap((entry) =>
          entry.validationResult?.ruleResults.map((rule) => rule.ruleId) ?? [],
        ),
    ).not.toContain("okf.concept.frontmatter");
  });

  for (const failureCase of failureCases) {
    it(`emits deterministic diagnostics for ${failureCase.name}`, () => {
      const result = validateOkfBundle(failureCase.bundlePath, [
        failureCase.path,
      ]);
      const entry = requireEntry(result, failureCase.path);

      expect(result.valid).toBe(false);
      expect(result.diagnostics).toEqual(entry.diagnostics);
      expect(entry).toMatchObject({
        parseDiagnostics: [],
        normalizationDiagnostics: [],
        profileDiagnostics: [],
        profilePath: okfProfiles[classifyOkfDocumentRole(failureCase.path)],
      });
      expect(entry.validationResult?.valid).toBe(false);
      expect(entry.validationDiagnostics).toEqual([
        expect.objectContaining({
          ...failureCase.expectedDiagnostic,
          severity: "error",
        }),
      ]);
    });
  }
});

function validateOkfBundle(
  bundlePath: string,
  paths: readonly string[],
): ValidateDocumentSetResult {
  return validateDocumentSet(
    paths.map((path) => okfEntry(bundlePath, path)),
    {
      includeEvidence: true,
      preserveSourceLocations: false,
    },
  );
}

function okfEntry(bundlePath: string, path: string): ValidateDocumentSetEntry {
  const role = classifyOkfDocumentRole(path);
  const profilePath = okfProfiles[role];

  return {
    path,
    markdown: readRepoFile(`${okfExampleRoot}/${bundlePath}/${path}`),
    profile: readRepoFile(profilePath),
    profilePath,
  };
}

function classifyOkfDocumentRole(path: string): OkfDocumentRole {
  const segments = path.split("/");
  const filename = segments.at(-1);

  if (filename === "log.md") {
    return "log";
  }

  if (filename === "index.md") {
    return segments.length === 1 ? "root-index" : "non-root-index";
  }

  return "concept";
}

function profilePathsByEntryPath(
  result: ValidateDocumentSetResult,
): Record<string, string | undefined> {
  return Object.fromEntries(
    result.entries.map((entry) => [entry.path, entry.profilePath]),
  );
}

function requireEntry(
  result: ValidateDocumentSetResult,
  path: string,
): ValidateDocumentSetEntryResult {
  const entry = result.entries.find((candidate) => candidate.path === path);

  if (entry === undefined) {
    throw new Error(`Expected OKF document-set result for ${path}.`);
  }

  return entry;
}

function expectEntryRuleIds(
  result: ValidateDocumentSetResult,
  path: string,
  ruleIds: readonly string[],
): void {
  expect(
    requireEntry(result, path).validationResult?.ruleResults.map(
      (rule) => rule.ruleId,
    ),
  ).toEqual([...ruleIds]);
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
