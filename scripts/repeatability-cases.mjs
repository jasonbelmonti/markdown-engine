import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
    ...serializedFormatCases(serialize, "parse:representative", representativeParse),
    ...serializedFormatCases(
      serialize,
      "normalize:representative",
      representativeNormalize,
    ),
    ...serializedFormatCases(
      serialize,
      "validate:representative-pass",
      passingValidation,
    ),
    ...serializedFormatCases(
      serialize,
      "validate:wp-4-diagnostics",
      diagnosticsValidation,
    ),
  ];
}

function serializedFormatCases(serialize, name, result) {
  return [
    serializedCase(serialize, `${name}:compact`, result),
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
