import type { EngineDocument } from "./document.js";
import type {
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  JsonSafeValue,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
import type {
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";

export type {
  DeclarativeAssertion,
  DeclarativeIdSource,
  DeclarativeOutputFormat,
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  DeclarativeSectionOrder,
  DeclarativeSelector,
  DeclarativeTableCellPredicate,
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  JsonSafeValue,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
export type { DeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
export type {
  DeclarativeValidationCliJsonResult,
  DeclarativeValidationConfigErrorResult,
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";

export interface DeclarativeValidationApi {
  parseValidationProfile(
    input: string | JsonSafeValue,
    options?: DeclarativeProfileParseOptions,
  ): DeclarativeProfileParseResult;
  validateWithProfile(
    document: EngineDocument,
    profile: ValidationProfile,
    options?: DeclarativeValidationOptions,
  ): DeclarativeValidationResult;
}

export function parseValidationProfile(
  _input: string | JsonSafeValue,
  _options: DeclarativeProfileParseOptions = {},
): DeclarativeProfileParseResult {
  throw declarativeValidationNotImplemented("parseValidationProfile");
}

export function validateWithProfile(
  _document: EngineDocument,
  _profile: ValidationProfile,
  _options: DeclarativeValidationOptions = {},
): DeclarativeValidationResult {
  throw declarativeValidationNotImplemented("validateWithProfile");
}

function declarativeValidationNotImplemented(apiName: string): Error {
  const error = new Error(
    `${apiName} is scaffolded for the declarative validation implementation lane but is not implemented in BEL-973 / WP-1A.`,
  );
  error.name = "DeclarativeValidationNotImplementedError";

  return error;
}
