import type { NormalizeResult } from "./normalize.js";
import type { ParseResult } from "./parse.js";
import type { ValidationResult } from "./validate.js";

export type SerializableMarkdownEngineResult =
  | ParseResult
  | NormalizeResult
  | ValidationResult;

export interface SerializeOptions {
  pretty?: boolean;
}

export type SerializeFunction = (
  result: SerializableMarkdownEngineResult,
  options?: SerializeOptions,
) => string;
