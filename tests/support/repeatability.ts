import { fileURLToPath } from "node:url";

import {
  documentQueries,
  normalize,
  parse,
  serialize,
  validate,
  validateAnnotations,
} from "@jasonbelmonti/markdown-engine";

import { buildSerializedCases } from "../../scripts/repeatability-cases.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export interface SerializedRepeatabilityCase {
  name: string;
  json: string;
  sha256: string;
  byteLength: number;
}

export function serializedRepeatabilityCases(): SerializedRepeatabilityCase[] {
  return buildSerializedCases(repoRoot, {
    documentQueries,
    normalize,
    parse,
    serialize,
    validate,
    validateAnnotations,
  }) as SerializedRepeatabilityCase[];
}
