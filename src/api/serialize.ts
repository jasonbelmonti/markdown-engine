import type { SerializableEngineResult } from "./document.js";
import type { NormalizeResult } from "./normalize.js";
import type { ParseResult } from "./parse.js";
import type { ValidationResult } from "./validate.js";
import { isPlainRecord } from "../internal/plain-record.js";

export type SerializableMarkdownEngineResult =
  | ParseResult
  | NormalizeResult
  | ValidationResult
  | SerializableEngineResult;

export interface SerializeOptions {
  pretty?: boolean;
}

export type SerializeFunction = (
  result: SerializableMarkdownEngineResult,
  options?: SerializeOptions,
) => string;

export const serialize: SerializeFunction = (result, options = {}) => {
  const serialized = JSON.stringify(
    normalizeSerializableValue(result),
    null,
    options.pretty === true ? 2 : 0,
  );

  return serialized ?? "null";
};

function normalizeSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSerializableValue(item));
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, normalizeSerializableValue(value[key])]),
    );
  }

  return value;
}
