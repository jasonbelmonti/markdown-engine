import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import {
  hasConfigUnsupportedKeyPrecedence,
  profileDiagnostic,
  unsupportedProfileKey,
} from "../diagnostics/profile-config-diagnostics.js";
import type { DeclarativeAssertion, DeclarativeIdSource } from "./index.js";
import {
  invalidShape,
  isFiniteNumber,
  optionalBooleanField,
  optionalStringArrayField,
  optionalStringField,
  requiredNonEmptyStringField,
  stringArray,
  unsupportedKeys,
} from "./schema-values.js";

const SUPPORTED_ASSERTION_KEYS = [
  "sectionsRequired",
  "tableColumnsRequired",
  "ids",
  "references",
  "text",
  "textOccurrenceCount",
  "textLength",
  "frontmatterRequired",
] as const;

export function assertionFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeAssertion | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("Rule assert must be an object."));

    return undefined;
  }

  const hasUnsupportedVocabulary = unsupportedAssertionKeys(value, diagnostics);

  const assertion = {
    ...sectionsRequiredFromValue(value.sectionsRequired, diagnostics),
    ...tableColumnsRequiredFromValue(value.tableColumnsRequired, diagnostics),
    ...idsFromValue(value.ids, diagnostics),
    ...referencesFromValue(value.references, diagnostics),
    ...textAssertionFromValue(value.text, diagnostics),
    ...textOccurrenceCountFromValue(value.textOccurrenceCount, diagnostics),
    ...textLengthFromValue(value.textLength, diagnostics),
    ...frontmatterRequiredFromValue(value.frontmatterRequired, diagnostics),
  };

  if (Object.keys(assertion).length === 0) {
    if (hasUnsupportedVocabulary) {
      return undefined;
    }

    diagnostics.push(
      invalidShape("Rule assert must include at least one supported assertion."),
    );

    return undefined;
  }

  return assertion;
}

function unsupportedAssertionKeys(
  value: Record<string, unknown>,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let hasUnsupportedVocabulary = false;

  for (const key of Object.keys(value)) {
    if (SUPPORTED_ASSERTION_KEYS.includes(key as SupportedAssertionKey)) {
      continue;
    }

    hasUnsupportedVocabulary = true;

    if (hasConfigUnsupportedKeyPrecedence(key)) {
      diagnostics.push(unsupportedProfileKey(key));
      continue;
    }

    diagnostics.push(
      profileDiagnostic(
        "profile.compile.unsupportedAssertion",
        `Unsupported assertion "${key}".`,
      ),
    );
  }

  return hasUnsupportedVocabulary;
}

type SupportedAssertionKey = (typeof SUPPORTED_ASSERTION_KEYS)[number];

function sectionsRequiredFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "sectionsRequired"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("sectionsRequired must be an object."));

    return {};
  }

  unsupportedKeys(value, ["headings", "order"], diagnostics);

  const headings = stringArray(value.headings);
  if (headings === undefined) {
    diagnostics.push(
      invalidShape(
        "sectionsRequired.headings must be an array of non-empty strings.",
      ),
    );

    return {};
  }

  if (
    value.order !== undefined &&
    value.order !== "none" &&
    value.order !== "strict"
  ) {
    diagnostics.push(
      invalidShape(
        "sectionsRequired.order must be \"none\" or \"strict\" when provided.",
      ),
    );

    return {};
  }

  return {
    sectionsRequired: {
      headings,
      ...(value.order !== undefined ? { order: value.order } : {}),
    },
  };
}

function tableColumnsRequiredFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "tableColumnsRequired"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("tableColumnsRequired must be an object."));

    return {};
  }

  unsupportedKeys(value, ["columns"], diagnostics);

  const columns = stringArray(value.columns);
  if (columns === undefined) {
    diagnostics.push(
      invalidShape(
        "tableColumnsRequired.columns must be an array of non-empty strings.",
      ),
    );

    return {};
  }

  return { tableColumnsRequired: { columns } };
}

function idsFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "ids"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("ids must be an object."));

    return {};
  }

  unsupportedKeys(value, ["prefix", "unique", "caseSensitive"], diagnostics);

  if (value.unique !== true) {
    diagnostics.push(invalidShape("ids.unique must be true."));

    return {};
  }

  return {
    ids: {
      ...optionalAssertionString(value, "prefix", diagnostics),
      unique: true,
      ...optionalBoolean(value, "caseSensitive", diagnostics),
    },
  };
}

function referencesFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "references"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("references must be an object."));

    return {};
  }

  unsupportedKeys(value, ["idsFrom", "mustAppearIn"], diagnostics);

  const idsFrom = idSourceFromValue(value.idsFrom, diagnostics);
  const mustAppearIn = stringArray(value.mustAppearIn);

  if (mustAppearIn === undefined) {
    diagnostics.push(
      invalidShape("references.mustAppearIn must be an array of non-empty strings."),
    );
  }

  return idsFrom === undefined || mustAppearIn === undefined
    ? {}
    : { references: { idsFrom, mustAppearIn } };
}

function textAssertionFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "text"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("text must be an object."));

    return {};
  }

  unsupportedKeys(value, ["contains", "excludes"], diagnostics);

  const text = {
    ...optionalAssertionString(value, "contains", diagnostics),
    ...optionalStringArray(value, "excludes", diagnostics),
  };

  if (!hasTextPredicate(text)) {
    diagnostics.push(
      invalidShape(
        "text must include contains or a non-empty excludes array.",
      ),
    );

    return {};
  }

  return { text };
}

function textOccurrenceCountFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "textOccurrenceCount"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("textOccurrenceCount must be an object."));

    return {};
  }

  unsupportedKeys(value, ["text", "count"], diagnostics);

  const text = requiredAssertionString(
    value.text,
    "textOccurrenceCount.text",
    diagnostics,
  );
  const count = isFiniteNumber(value.count) ? value.count : undefined;

  if (count === undefined) {
    diagnostics.push(invalidShape("textOccurrenceCount.count must be a number."));
  }

  return text === undefined || count === undefined
    ? {}
    : {
        textOccurrenceCount: {
          text,
          count,
        },
      };
}

function textLengthFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "textLength"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("textLength must be an object."));

    return {};
  }

  unsupportedKeys(value, ["min", "max"], diagnostics);

  const diagnosticCountBeforeBounds = diagnostics.length;
  const textLength = {
    ...optionalTextLengthBound(value, "min", diagnostics),
    ...optionalTextLengthBound(value, "max", diagnostics),
  };

  if (!hasTextLengthBound(textLength)) {
    if (diagnostics.length === diagnosticCountBeforeBounds) {
      diagnostics.push(
        invalidShape("textLength must include min, max, or both."),
      );
    }

    return {};
  }

  if (!hasValidTextLengthRange(textLength)) {
    diagnostics.push(
      invalidShape("textLength.min must be less than or equal to textLength.max."),
    );

    return {};
  }

  return { textLength };
}

function frontmatterRequiredFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "frontmatterRequired"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("frontmatterRequired must be an object."));

    return {};
  }

  unsupportedKeys(value, ["fields"], diagnostics);

  const fields = stringArray(value.fields);
  if (fields === undefined) {
    diagnostics.push(
      invalidShape("frontmatterRequired.fields must be an array of non-empty strings."),
    );

    return {};
  }

  return { frontmatterRequired: { fields } };
}

function idSourceFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeIdSource | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("references.idsFrom must be an object."));

    return undefined;
  }

  unsupportedKeys(value, ["section", "column", "prefix"], diagnostics);

  return {
    ...optionalAssertionString(value, "section", diagnostics),
    ...optionalAssertionString(value, "column", diagnostics),
    ...optionalAssertionString(value, "prefix", diagnostics),
  };
}

function optionalAssertionString(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<string, string>> {
  return optionalStringField(
    record,
    key,
    diagnostics,
    (field) => `${field} must be a non-empty string when provided.`,
  );
}

function optionalStringArray(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<string, readonly string[]>> {
  return optionalStringArrayField(
    record,
    key,
    diagnostics,
    (field) =>
      `${field} must be an array of non-empty strings when provided.`,
  );
}

function optionalBoolean(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<string, boolean>> {
  return optionalBooleanField(
    record,
    key,
    diagnostics,
    (field) => `${field} must be a boolean when provided.`,
  );
}

function optionalTextLengthBound(
  record: Record<string, unknown>,
  key: "min" | "max",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"min" | "max", number>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (!isFiniteNumber(value)) {
    diagnostics.push(
      invalidShape(`textLength.${key} must be a number when provided.`),
    );

    return {};
  }

  if (!isTextLengthBound(value)) {
    diagnostics.push(
      invalidShape(
        `textLength.${key} must be a non-negative integer when provided.`,
      ),
    );

    return {};
  }

  return { [key]: value } as Partial<Record<"min" | "max", number>>;
}

function requiredAssertionString(
  value: unknown,
  field: string,
  diagnostics: MarkdownDiagnostic[],
): string | undefined {
  return requiredNonEmptyStringField(
    value,
    field,
    diagnostics,
    (fieldName) => `${fieldName} must be a non-empty string.`,
  );
}

function hasTextPredicate(text: DeclarativeAssertion["text"]): boolean {
  return text?.contains !== undefined || text?.excludes !== undefined;
}

function hasTextLengthBound(
  textLength: DeclarativeAssertion["textLength"],
): boolean {
  return textLength?.min !== undefined || textLength?.max !== undefined;
}

function hasValidTextLengthRange(
  textLength: DeclarativeAssertion["textLength"],
): boolean {
  return (
    textLength?.min === undefined ||
    textLength.max === undefined ||
    textLength.min <= textLength.max
  );
}

function isTextLengthBound(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
