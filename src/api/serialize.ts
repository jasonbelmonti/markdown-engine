import {
  assertCompatibleResultVersion,
  type EngineCompatibilityMode,
} from "./compatibility.js";
import type { ValidateDocumentSetResult } from "./document-set-validation-types.js";
import type { SerializableEngineResult } from "./document.js";
import type { NormalizeResult } from "./normalize.js";
import type { ParseResult } from "./parse.js";
import type { ValidationResult } from "./validate.js";
import { normalizeStableJsonValue } from "../internal/stable-json.js";

export type SerializableMarkdownEngineResult =
  | ParseResult
  | NormalizeResult
  | ValidateDocumentSetResult
  | ValidationResult
  | SerializableEngineResult;

export {
  EngineCompatibilityError,
  type EngineCompatibilityMode,
} from "./compatibility.js";

export interface SerializeOptions {
  pretty?: boolean;
  compatibilityMode?: EngineCompatibilityMode;
}

export type SerializeFunction = (
  result: SerializableMarkdownEngineResult,
  options?: SerializeOptions,
) => string;

export const serialize: SerializeFunction = (result, options = {}) => {
  if (options.compatibilityMode !== undefined) {
    assertCompatibleResultVersion(result, options.compatibilityMode);
  }

  const serialized = JSON.stringify(
    normalizeStableJsonValue(result),
    null,
    options.pretty === true ? 2 : 0,
  );

  return serialized ?? "null";
};
