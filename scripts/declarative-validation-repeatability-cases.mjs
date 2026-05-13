import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fixturePath = "fixtures/declarative-validation/proving/representative.md";

const defaultedPassingProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  rules: [
    {
      id: "sections.present",
      select: { target: "document" },
      assert: {
        sectionsRequired: {
          headings: ["Objective", "Context", "Verification"],
        },
      },
    },
    {
      id: "objective.text",
      select: { target: "section", title: "Objective" },
      assert: {
        text: { contains: "declarative validation architecture viable" },
      },
    },
  ],
};

const explicitDefaultPassingProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: defaultedPassingProfile.rules.map((rule) => ({
    ...rule,
    severity: "error",
  })),
};

const failingProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "verification.missing",
      select: { target: "section", title: "Verification" },
      assert: {
        text: { contains: "unresolved selector gap" },
      },
    },
  ],
};

export function buildDeclarativeValidationRepeatabilityCases(repoRoot, engine) {
  const { normalize, parse, serialize, validateWithProfile } = engine;
  const markdown = readFileSync(join(repoRoot, fixturePath), "utf8");
  const document = normalize(parse(markdown, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0",
  }).document;
  const alternatePathDocument = normalize(
    parse(markdown, {
      path: "fixtures/declarative-validation/proving/alternate-path.md",
    }).parsed,
    { documentVersion: "1.0.0" },
  ).document;
  const passingResult = validateWithEvidence(
    validateWithProfile,
    document,
    defaultedPassingProfile,
  );
  const explicitDefaultResult = validateWithEvidence(
    validateWithProfile,
    document,
    explicitDefaultPassingProfile,
  );
  const alternatePathResult = validateWithEvidence(
    validateWithProfile,
    alternatePathDocument,
    defaultedPassingProfile,
  );
  const failingResult = validateWithEvidence(
    validateWithProfile,
    document,
    failingProfile,
  );

  return [
    { name: "declarative-validation:passing-result", result: passingResult },
    {
      name: "declarative-validation:passing-evidence",
      result: requiredEvidence(passingResult),
    },
    {
      name: "declarative-validation:explicit-default-result",
      result: explicitDefaultResult,
    },
    {
      name: "declarative-validation:alternate-path-result",
      result: alternatePathResult,
    },
    { name: "declarative-validation:failing-result", result: failingResult },
    {
      name: "declarative-validation:failing-evidence",
      result: requiredEvidence(failingResult),
    },
  ].flatMap(({ name, result }) =>
    serializedFormatCases(serialize, name, result),
  );
}

function validateWithEvidence(validateWithProfile, document, profile) {
  return validateWithProfile(document, profile, { includeEvidence: true });
}

function requiredEvidence(result) {
  if (result.evidence === undefined) {
    throw new Error("Expected declarative validation result to include evidence.");
  }

  return result.evidence;
}

function serializedFormatCases(serialize, name, result) {
  return [
    serializedCase(serialize, `${name}:compact`, result, {}),
    serializedCase(serialize, `${name}:pretty`, result, { pretty: true }),
  ];
}

function serializedCase(serialize, name, result, options) {
  const json = serialize(result, options);

  return {
    name,
    json,
    sha256: createHash("sha256").update(json, "utf8").digest("hex"),
    byteLength: Buffer.byteLength(json, "utf8"),
  };
}
