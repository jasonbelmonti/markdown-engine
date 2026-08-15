import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const conditionalRepeatabilityFixturePath =
  "fixtures/declarative-validation/conditional-v2/repeatability.md";
const conditionalRepeatabilityProfilePath =
  "fixtures/declarative-validation/conditional-v2/repeatability-profile.yaml";

const v2IdCountProfile = {
  syntaxVersion: "markdown-engine.validation@v2",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "v2.ids.repeatability",
      select: { target: "tableCell", column: "ID" },
      assert: {
        ids: {
          prefix: "REQ",
          minCount: 2,
          maxCount: 2,
        },
      },
    },
  ],
};

const v2TableColumnCoverageProfile = {
  syntaxVersion: "markdown-engine.validation@v2",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "v2.table-coverage.repeatability",
      select: { target: "document" },
      assert: {
        tableColumnCoverage: {
          source: {
            section: "Requirements",
            column: "ID",
            prefix: "REQ",
          },
          target: {
            section: "Traceability",
            column: "Requirement",
          },
          require: "everySourceId",
        },
      },
    },
  ],
};

const v2TableColumnsExactProfile = {
  syntaxVersion: "markdown-engine.validation@v2",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "v2.table-columns-exact.repeatability",
      select: { target: "table", section: "Mission" },
      assert: { tableColumnsExact: { columns: ["Owner", "Status"] } },
    },
  ],
};

export function buildConditionalV2RepeatabilityCases(repoRoot, engine) {
  const { normalize, parse, parseValidationProfile, validateWithProfile } =
    engine;
  const conditionalRepeatabilityMarkdown = readFileSync(
    join(repoRoot, conditionalRepeatabilityFixturePath),
    "utf8",
  );
  const conditionalRepeatabilityProfile = requiredProfile(
    parseValidationProfile,
    readFileSync(join(repoRoot, conditionalRepeatabilityProfilePath), "utf8"),
  );
  const conditionalRepeatabilityDocument = normalize(
    parse(conditionalRepeatabilityMarkdown, {
      path: conditionalRepeatabilityFixturePath,
    }).parsed,
    { documentVersion: "1.0.0" },
  ).document;
  const v2IdCountResult = validateWithEvidence(
    validateWithProfile,
    conditionalRepeatabilityDocument,
    v2IdCountProfile,
  );
  const v2TableColumnCoverageResult = validateWithEvidence(
    validateWithProfile,
    conditionalRepeatabilityDocument,
    v2TableColumnCoverageProfile,
  );
  const v2TableColumnsExactResult = validateWithEvidence(
    validateWithProfile,
    conditionalRepeatabilityDocument,
    v2TableColumnsExactProfile,
  );
  const v2CompositeResult = validateWithEvidence(
    validateWithProfile,
    conditionalRepeatabilityDocument,
    conditionalRepeatabilityProfile,
  );

  return {
    resultEntries: [
      {
        name: "declarative-validation:v2-id-count-result",
        result: v2IdCountResult,
      },
      {
        name: "declarative-validation:v2-id-count-evidence",
        result: requiredEvidence(v2IdCountResult),
      },
      {
        name: "declarative-validation:v2-table-column-coverage-result",
        result: v2TableColumnCoverageResult,
      },
      {
        name: "declarative-validation:v2-table-column-coverage-evidence",
        result: requiredEvidence(v2TableColumnCoverageResult),
      },
      {
        name: "declarative-validation:v2-table-columns-exact-result",
        result: v2TableColumnsExactResult,
      },
      {
        name: "declarative-validation:v2-table-columns-exact-evidence",
        result: requiredEvidence(v2TableColumnsExactResult),
      },
      {
        name: "declarative-validation:v2-composite-result",
        result: v2CompositeResult,
      },
      {
        name: "declarative-validation:v2-composite-evidence",
        result: requiredEvidence(v2CompositeResult),
      },
    ],
    cliCase: cliValidationJsonCase(repoRoot),
  };
}

function validateWithEvidence(validateWithProfile, document, profile) {
  return validateWithProfile(document, profile, { includeEvidence: true });
}

function requiredProfile(parseValidationProfile, profileText) {
  const result = parseValidationProfile(profileText);

  if (result.profile === undefined || result.diagnostics.length > 0) {
    throw new Error(
      `Expected repeatability profile to parse without diagnostics: ${JSON.stringify(
        result.diagnostics,
      )}`,
    );
  }

  return result.profile;
}

function requiredEvidence(result) {
  if (result.evidence === undefined) {
    throw new Error("Expected declarative validation result to include evidence.");
  }

  return result.evidence;
}

function cliValidationJsonCase(repoRoot) {
  const result = spawnSync(
    process.execPath,
    [
      "dist/cli/index.js",
      "validate",
      "--file",
      conditionalRepeatabilityFixturePath,
      "--profile",
      conditionalRepeatabilityProfilePath,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== 0 || result.stderr !== "") {
    throw new Error(
      [
        "Conditional V2 CLI repeatability case failed.",
        `exit: ${result.status ?? "signal"}`,
        `stdout: ${result.stdout}`,
        `stderr: ${result.stderr}`,
      ].join("\n"),
    );
  }

  return serializedTextCase(
    "declarative-validation:v2-composite-cli-json",
    result.stdout,
  );
}

function serializedTextCase(name, json) {
  return {
    name,
    json,
    sha256: createHash("sha256").update(json, "utf8").digest("hex"),
    byteLength: Buffer.byteLength(json, "utf8"),
  };
}
