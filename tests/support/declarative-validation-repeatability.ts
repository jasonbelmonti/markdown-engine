import { fileURLToPath } from "node:url";

import {
  normalize,
  parse,
  parseValidationProfile,
  serialize,
  validateWithProfile,
} from "@jasonbelmonti/markdown-engine";

import { buildDeclarativeValidationRepeatabilityCases } from "../../scripts/declarative-validation-repeatability-cases.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export interface DeclarativeValidationRepeatabilityCase {
  name: string;
  json: string;
  sha256: string;
  byteLength: number;
}

export function declarativeValidationRepeatabilityCases(): DeclarativeValidationRepeatabilityCase[] {
  return buildDeclarativeValidationRepeatabilityCases(repoRoot, {
    normalize,
    parse,
    parseValidationProfile,
    serialize,
    validateWithProfile,
  }) as DeclarativeValidationRepeatabilityCase[];
}
