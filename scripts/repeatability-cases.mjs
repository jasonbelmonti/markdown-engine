import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildRichIrRepeatabilityOutputs } from "./rich-ir-repeatability-cases.mjs";

const representativePath = "fixtures/representative.md";
const diagnosticsPath = "fixtures/rules/wp-4-diagnostics.md";

const passingConfig = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
    "headings.required": {
      headings: ["Mission Brief"],
    },
    "codeFences.languages": {
      allowed: ["ts"],
      requireLanguage: true,
    },
    "links.allowedSchemes": {
      schemes: ["https"],
    },
    "rawHtml.policy": {
      policy: "allow",
    },
  },
};

const diagnosticsConfig = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
    "headings.required": {
      headings: ["Mission Brief", "Validation Gates"],
    },
    "codeFences.languages": {
      allowed: ["ts"],
      requireLanguage: true,
    },
    "links.allowedSchemes": {
      schemes: ["https"],
    },
    "rawHtml.policy": {
      policy: "deny",
    },
    "semantic.summaryQuality": {
      threshold: "high",
    },
  },
};

export function buildSerializedCases(repoRoot, engine) {
  const { normalize, parse, serialize, validate } = engine;
  const representativeMarkdown = readFileSync(
    join(repoRoot, representativePath),
    "utf8",
  );
  const diagnosticsMarkdown = readFileSync(
    join(repoRoot, diagnosticsPath),
    "utf8",
  );
  const representativeParse = parse(representativeMarkdown, {
    path: representativePath,
  });
  const representativeNormalize = normalize(representativeParse.parsed);
  const passingValidation = validate(
    representativeNormalize.document,
    passingConfig,
  );
  const diagnosticsNormalize = normalize(
    parse(diagnosticsMarkdown, { path: diagnosticsPath }).parsed,
  );
  const diagnosticsValidation = validate(
    diagnosticsNormalize.document,
    diagnosticsConfig,
  );

  return [
    { name: "parse:representative", result: representativeParse },
    { name: "normalize:representative", result: representativeNormalize },
    { name: "validate:representative-pass", result: passingValidation },
    { name: "validate:wp-4-diagnostics", result: diagnosticsValidation },
    ...buildRichIrRepeatabilityOutputs(repoRoot, engine),
  ].flatMap(({ name, result, options }) =>
    serializedFormatCases(serialize, name, result, options),
  );
}

function serializedFormatCases(serialize, name, result, options = {}) {
  return [
    serializedCase(serialize, `${name}:compact`, result, options),
    serializedCase(serialize, `${name}:pretty`, result, {
      ...options,
      pretty: true,
    }),
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
