import { fileURLToPath } from "node:url";

import {
  normalize,
  parse,
  serialize,
  validate,
} from "markdown-engine";

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
    normalize,
    parse,
    serialize,
    validate,
  }) as SerializedRepeatabilityCase[];
}
