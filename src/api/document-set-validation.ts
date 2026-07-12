import type {
  DeclarativeValidationResult,
  JsonSafeValue,
} from "./declarative-validation.js";
import {
  parseValidationProfile,
  validateWithProfile,
} from "./declarative-validation.js";
import type { NormalizeOptions } from "./normalize.js";
import { normalize } from "./normalize.js";
import { parse } from "./parse.js";
import type {
  ValidateDocumentSetEntry,
  ValidateDocumentSetEntryResult,
  ValidateDocumentSetFunction,
  ValidateDocumentSetOptions,
  ValidateDocumentSetProfileInput,
} from "./document-set-validation-types.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";

export type {
  ValidateDocumentSetEntry,
  ValidateDocumentSetEntryResult,
  ValidateDocumentSetFunction,
  ValidateDocumentSetOptions,
  ValidateDocumentSetProfileInput,
  ValidateDocumentSetResult,
} from "./document-set-validation-types.js";

export const validateDocumentSet: ValidateDocumentSetFunction = (
  entries,
  options = {},
) => {
  const entryResults = entries.map((entry) =>
    validateDocumentSetEntry(entry, options),
  );
  const diagnostics = cloneDiagnostics(
    entryResults.flatMap((entry) => entry.diagnostics),
  );

  return {
    valid: !hasErrorDiagnostic(diagnostics),
    diagnostics,
    entries: entryResults,
  };
};

function validateDocumentSetEntry(
  entry: ValidateDocumentSetEntry,
  options: ValidateDocumentSetOptions,
): ValidateDocumentSetEntryResult {
  const parseResult = parse(entry.markdown, { path: entry.path });
  const normalizeResult = normalize(parseResult.parsed, normalizeOptions(options));
  const profileResult = parseValidationProfile(profileParserInput(entry.profile), {
    ...(entry.profilePath !== undefined ? { path: entry.profilePath } : {}),
  });
  let validationResult: DeclarativeValidationResult | undefined;
  if (
    profileResult.profile !== undefined &&
    !hasErrorDiagnostic(profileResult.diagnostics)
  ) {
    validationResult = validateWithProfile(
      normalizeResult.document,
      profileResult.profile,
      {
        path: entry.path,
        sourceText: entry.markdown,
        ...(options.includeEvidence !== undefined
          ? { includeEvidence: options.includeEvidence }
          : {}),
      },
    );
  }
  const validationDiagnostics =
    validationResult === undefined ? [] : validationResult.diagnostics;
  const diagnostics = cloneDiagnostics([
    ...normalizeResult.diagnostics,
    ...profileResult.diagnostics,
    ...validationDiagnostics,
  ]);

  return {
    path: entry.path,
    ...(entry.profilePath !== undefined ? { profilePath: entry.profilePath } : {}),
    diagnostics,
    parseDiagnostics: cloneDiagnostics(parseResult.diagnostics),
    normalizationDiagnostics: cloneDiagnostics(normalizeResult.diagnostics),
    profileDiagnostics: cloneDiagnostics(profileResult.diagnostics),
    validationDiagnostics: cloneDiagnostics(validationDiagnostics),
    ...(validationResult !== undefined ? { validationResult } : {}),
  };
}

function normalizeOptions(options: ValidateDocumentSetOptions): NormalizeOptions {
  return {
    ...(options.documentVersion !== undefined
      ? { documentVersion: options.documentVersion }
      : {}),
    ...(options.preserveSourceLocations !== undefined
      ? { preserveSourceLocations: options.preserveSourceLocations }
      : {}),
  };
}

function profileParserInput(
  input: ValidateDocumentSetProfileInput,
): string | JsonSafeValue {
  return input as string | JsonSafeValue;
}
