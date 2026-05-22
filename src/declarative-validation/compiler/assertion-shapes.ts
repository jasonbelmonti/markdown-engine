import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { unsupportedProfileKey } from "../diagnostics/profile-config-diagnostics.js";
import type { DeclarativeAssertion } from "../profile/index.js";
import { stringArray } from "../profile/schema-values.js";
import { compileDiagnostic } from "./diagnostics.js";

export function pushUnsupportedKeyDiagnostics(
  record: object,
  allowedKeys: readonly string[],
  diagnostics: MarkdownDiagnostic[],
): boolean {
  const diagnosticCountBefore = diagnostics.length;

  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      diagnostics.push(unsupportedProfileKey(key));
    }
  }

  return diagnostics.length === diagnosticCountBefore;
}

export function pushObjectDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (isPlainRecord(value)) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be an object.`,
      ruleId,
    ),
  );

  return false;
}

export function pushTextShapeDiagnostics(
  assertion: DeclarativeAssertion["text"],
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let valid = true;

  if (
    assertion?.contains !== undefined &&
    !pushNonEmptyStringDiagnostic("contains", assertion.contains, ruleId, diagnostics)
  ) {
    valid = false;
  }

  if (
    assertion?.excludes !== undefined &&
    closedStringArray("excludes", assertion.excludes, ruleId, diagnostics) ===
      undefined
  ) {
    valid = false;
  }

  return valid;
}

export function pushSectionsRequiredOrderDiagnostic(
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (value === undefined || value === "none" || value === "strict") {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      'sectionsRequired.order must be "none" or "strict" when provided.',
      ruleId,
    ),
  );

  return false;
}

export function pushTextOccurrenceCountDiagnostic(
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  return pushNumberDiagnostic(
    value,
    ruleId,
    diagnostics,
    "textOccurrenceCount.count must be a number.",
  );
}

export function pushTextLengthShapeDiagnostics(
  assertion: DeclarativeAssertion["textLength"],
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let valid = true;
  const min = assertion?.min;
  const max = assertion?.max;

  if (
    min !== undefined &&
    !pushTextLengthNumberDiagnostic(
      "textLength.min",
      min,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    max !== undefined &&
    !pushTextLengthNumberDiagnostic(
      "textLength.max",
      max,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (valid && min !== undefined && max !== undefined && min > max) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "textLength.min must be less than or equal to textLength.max.",
        ruleId,
      ),
    );

    valid = false;
  }

  return valid;
}

export function pushIdsCountShapeDiagnostics(
  assertion: DeclarativeAssertion["ids"],
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let valid = true;
  const minCount = assertion?.minCount;
  const maxCount = assertion?.maxCount;

  if (
    minCount !== undefined &&
    !pushNonNegativeIntegerDiagnostic(
      "ids.minCount",
      minCount,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    maxCount !== undefined &&
    !pushNonNegativeIntegerDiagnostic(
      "ids.maxCount",
      maxCount,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    valid &&
    minCount !== undefined &&
    maxCount !== undefined &&
    minCount > maxCount
  ) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "ids.minCount must be less than or equal to ids.maxCount.",
        ruleId,
      ),
    );

    valid = false;
  }

  return valid;
}

export function pushOptionalNonEmptyStringDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  return value === undefined
    ? true
    : pushNonEmptyStringDiagnostic(fieldName, value, ruleId, diagnostics);
}

export function pushOptionalBooleanDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (value === undefined || typeof value === "boolean") {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be a boolean when provided.`,
      ruleId,
    ),
  );

  return false;
}

export function pushNonEmptyStringDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (typeof value === "string" && value.length > 0) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be a non-empty string when provided.`,
      ruleId,
    ),
  );

  return false;
}

function pushTextLengthNumberDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  return pushNonNegativeIntegerDiagnostic(fieldName, value, ruleId, diagnostics);
}

function pushNonNegativeIntegerDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `${fieldName} must be a number when provided.`,
        ruleId,
      ),
    );

    return false;
  }

  if (!Number.isInteger(value) || value < 0) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `${fieldName} must be a non-negative integer when provided.`,
        ruleId,
      ),
    );

    return false;
  }

  return true;
}

function pushNumberDiagnostic(
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
  message: string,
): boolean {
  if (typeof value === "number" && Number.isFinite(value)) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic("profile.config.invalidShape", message, ruleId),
  );

  return false;
}

export function closedStringArray(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): readonly string[] | undefined {
  const values = stringArray(value);

  if (values !== undefined) {
    return values;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be an array of non-empty strings.`,
      ruleId,
    ),
  );

  return undefined;
}

export function optionalString<TKey extends string>(
  key: TKey,
  value: string | undefined,
): Record<TKey, string> | Record<string, never> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, string>);
}

export function optionalStringArray<TKey extends string>(
  key: TKey,
  value: unknown,
): Record<TKey, readonly string[]> | Record<string, never> {
  if (value === undefined) {
    return {};
  }

  const values = stringArray(value);

  return values === undefined
    ? {}
    : ({ [key]: values } as unknown as Record<TKey, readonly string[]>);
}

export function optionalNumber<TKey extends string>(
  key: TKey,
  value: number | undefined,
): Record<TKey, number> | Record<string, never> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, number>);
}

export function hasTextPredicate(assertion: DeclarativeAssertion["text"]): boolean {
  return (
    assertion?.contains !== undefined ||
    (assertion?.excludes !== undefined && assertion.excludes.length > 0)
  );
}

export function hasTextLengthBound(
  assertion: DeclarativeAssertion["textLength"],
): boolean {
  return assertion?.min !== undefined || assertion?.max !== undefined;
}
