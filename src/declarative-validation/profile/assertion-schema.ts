import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import {
  hasConfigUnsupportedKeyPrecedence,
  profileDiagnostic,
  unsupportedProfileKey,
} from "../diagnostics/profile-config-diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeIdSource,
  DeclarativeTableColumnCoverageSource,
  DeclarativeTableColumnCoverageTarget,
} from "./index.js";
import { frontmatterShapeFromValue as frontmatterShapeSchemaFromValue } from "./frontmatter-shape-schema.js";
import {
  hasEffectiveIdsPredicate,
  hasValidIdsCountRange,
  idsAssertionKeysForSyntaxVersion,
  idsAssertionSupportsCountBounds,
  type IdsCountBoundKey,
} from "./ids-assertion-contract.js";
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
import {
  PROFILE_SYNTAX_VERSION_V2,
  type ValidationProfileSyntaxVersion,
} from "./syntax-version.js";
import {
  isTextFormatAssertionFormat,
  TEXT_FORMAT_ASSERTION_KEYS,
} from "./text-format-contract.js";

const SUPPORTED_ASSERTION_KEYS_V1 = [
  "exists",
  "sectionsRequired",
  "tableColumnsRequired",
  "ids",
  "references",
  "text",
  "textOccurrenceCount",
  "textLength",
  "frontmatterRequired",
] as const;

const SUPPORTED_ASSERTION_KEYS_V2 = [
  ...SUPPORTED_ASSERTION_KEYS_V1,
  "tableColumnCoverage",
  "frontmatterShape",
  "textFormat",
] as const;

export function assertionFromValue(
  value: unknown,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeAssertion | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("Rule assert must be an object."));

    return undefined;
  }

  const hasUnsupportedVocabulary = unsupportedAssertionKeys(
    value,
    syntaxVersion,
    diagnostics,
  );

  const assertion = {
    ...existsFromValue(value.exists, diagnostics),
    ...sectionsRequiredFromValue(value.sectionsRequired, diagnostics),
    ...tableColumnsRequiredFromValue(value.tableColumnsRequired, diagnostics),
    ...idsFromValue(value.ids, syntaxVersion, diagnostics),
    ...referencesFromValue(value.references, diagnostics),
    ...textAssertionFromValue(value.text, diagnostics),
    ...textOccurrenceCountFromValue(value.textOccurrenceCount, diagnostics),
    ...textLengthFromValue(value.textLength, diagnostics),
    ...frontmatterRequiredFromValue(value.frontmatterRequired, diagnostics),
    ...(supportsV2AssertionSurface(syntaxVersion)
      ? tableColumnCoverageFromValue(value.tableColumnCoverage, diagnostics)
      : {}),
    ...(supportsV2AssertionSurface(syntaxVersion)
      ? frontmatterShapeFromValue(value.frontmatterShape, diagnostics)
      : {}),
    ...(supportsV2AssertionSurface(syntaxVersion)
      ? textFormatFromValue(value.textFormat, diagnostics)
      : {}),
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
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let hasUnsupportedVocabulary = false;
  const supportedAssertionKeys = assertionKeysForSyntaxVersion(syntaxVersion);

  for (const key of Object.keys(value)) {
    if (supportedAssertionKeys.includes(key as SupportedAssertionKey)) {
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

type SupportedAssertionKey = (typeof SUPPORTED_ASSERTION_KEYS_V2)[number];

function assertionKeysForSyntaxVersion(
  syntaxVersion: ValidationProfileSyntaxVersion,
): readonly SupportedAssertionKey[] {
  return supportsV2AssertionSurface(syntaxVersion)
    ? SUPPORTED_ASSERTION_KEYS_V2
    : SUPPORTED_ASSERTION_KEYS_V1;
}

function supportsV2AssertionSurface(
  syntaxVersion: ValidationProfileSyntaxVersion,
): boolean {
  return syntaxVersion === PROFILE_SYNTAX_VERSION_V2;
}

function existsFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "exists"> {
  if (value === undefined) {
    return {};
  }

  if (value !== true) {
    diagnostics.push(invalidShape("exists must be true."));

    return {};
  }

  return { exists: true };
}

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
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "ids"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("ids must be an object."));

    return {};
  }

  const supportsCountBounds = idsAssertionSupportsCountBounds(syntaxVersion);

  unsupportedKeys(value, idsAssertionKeysForSyntaxVersion(syntaxVersion), diagnostics);

  const diagnosticCountBeforeIdsShape = diagnostics.length;
  const ids = {
    ...optionalAssertionString(value, "prefix", diagnostics),
    ...(value.unique === true ? { unique: true as const } : {}),
    ...optionalBoolean(value, "caseSensitive", diagnostics),
    ...(supportsCountBounds
      ? optionalIdCountBound(value, "minCount", diagnostics)
      : {}),
    ...(supportsCountBounds
      ? optionalIdCountBound(value, "maxCount", diagnostics)
      : {}),
  };

  if (diagnostics.length > diagnosticCountBeforeIdsShape) {
    return {};
  }

  if (value.unique !== undefined && value.unique !== true) {
    diagnostics.push(invalidShape("ids.unique must be true."));

    return {};
  }

  if (!hasEffectiveIdsPredicate(ids, syntaxVersion)) {
    diagnostics.push(invalidShape("ids.unique must be true."));

    return {};
  }

  if (!hasValidIdsCountRange(ids)) {
    diagnostics.push(
      invalidShape("ids.minCount must be less than or equal to ids.maxCount."),
    );

    return {};
  }

  return {
    ids,
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

function tableColumnCoverageFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "tableColumnCoverage"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("tableColumnCoverage must be an object."));

    return {};
  }

  unsupportedKeys(value, ["source", "target", "require"], diagnostics);

  const source = tableColumnCoverageSourceFromValue(value.source, diagnostics);
  const target = tableColumnCoverageTargetFromValue(value.target, diagnostics);
  const require =
    value.require === "everySourceId" ? "everySourceId" : undefined;

  if (require === undefined) {
    diagnostics.push(
      invalidShape('tableColumnCoverage.require must be "everySourceId".'),
    );
  }

  return source === undefined || target === undefined || require === undefined
    ? {}
    : {
        tableColumnCoverage: {
          source,
          target,
          require,
        },
      };
}

function tableColumnCoverageSourceFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeTableColumnCoverageSource | undefined {
  const diagnosticCountBefore = diagnostics.length;

  if (!isPlainRecord(value)) {
    diagnostics.push(
      invalidShape("tableColumnCoverage.source must be an object."),
    );

    return undefined;
  }

  unsupportedKeys(
    value,
    ["section", "column", "prefix", "caseSensitive"],
    diagnostics,
  );

  const section = requiredAssertionString(
    value.section,
    "tableColumnCoverage.source.section",
    diagnostics,
  );
  const column = requiredAssertionString(
    value.column,
    "tableColumnCoverage.source.column",
    diagnostics,
  );
  const source = {
    ...optionalTableColumnCoverageSourceString(value, "prefix", diagnostics),
    ...optionalTableColumnCoverageSourceBoolean(
      value,
      "caseSensitive",
      diagnostics,
    ),
  };

  return section === undefined ||
    column === undefined ||
    diagnostics.length > diagnosticCountBefore
    ? undefined
    : {
        section,
        column,
        ...source,
      };
}

function tableColumnCoverageTargetFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeTableColumnCoverageTarget | undefined {
  const diagnosticCountBefore = diagnostics.length;

  if (!isPlainRecord(value)) {
    diagnostics.push(
      invalidShape("tableColumnCoverage.target must be an object."),
    );

    return undefined;
  }

  unsupportedKeys(value, ["section", "tableHeader", "column"], diagnostics);

  const section = requiredAssertionString(
    value.section,
    "tableColumnCoverage.target.section",
    diagnostics,
  );
  const column = requiredAssertionString(
    value.column,
    "tableColumnCoverage.target.column",
    diagnostics,
  );
  const target = {
    ...optionalTableColumnCoverageTargetStringArray(
      value,
      "tableHeader",
      diagnostics,
    ),
  };

  return section === undefined ||
    column === undefined ||
    diagnostics.length > diagnosticCountBefore
    ? undefined
    : {
        section,
        ...target,
        column,
      };
}

function optionalTableColumnCoverageSourceString(
  record: Record<string, unknown>,
  key: "prefix",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"prefix", string>> {
  return optionalStringField(
    record,
    key,
    diagnostics,
    (field) =>
      `tableColumnCoverage.source.${field} must be a non-empty string when provided.`,
  );
}

function optionalTableColumnCoverageSourceBoolean(
  record: Record<string, unknown>,
  key: "caseSensitive",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"caseSensitive", boolean>> {
  return optionalBooleanField(
    record,
    key,
    diagnostics,
    (field) =>
      `tableColumnCoverage.source.${field} must be a boolean when provided.`,
  );
}

function optionalTableColumnCoverageTargetStringArray(
  record: Record<string, unknown>,
  key: "tableHeader",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"tableHeader", readonly string[]>> {
  return optionalStringArrayField(
    record,
    key,
    diagnostics,
    (field) =>
      `tableColumnCoverage.target.${field} must be an array of non-empty strings when provided.`,
  );
}

function frontmatterShapeFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "frontmatterShape"> {
  if (value === undefined) {
    return {};
  }

  const result = frontmatterShapeSchemaFromValue(value);
  for (const key of result.unsupportedKeys) {
    diagnostics.push(unsupportedProfileKey(key));
  }
  for (const message of result.invalidShapes) {
    diagnostics.push(invalidShape(message));
  }

  return result.shape === undefined
    ? {}
    : { frontmatterShape: result.shape };
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

function textFormatFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "textFormat"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("textFormat must be an object."));

    return {};
  }

  const diagnosticCountBeforeShape = diagnostics.length;
  unsupportedKeys(value, TEXT_FORMAT_ASSERTION_KEYS, diagnostics);
  const format = value.format;
  const hasSupportedFormat = isTextFormatAssertionFormat(format);

  if (!hasSupportedFormat) {
    diagnostics.push(
      invalidShape('textFormat.format must be "isoDate".'),
    );
  }

  if (diagnostics.length > diagnosticCountBeforeShape || !hasSupportedFormat) {
    return {};
  }

  return { textFormat: { format } };
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

function optionalIdCountBound(
  record: Record<string, unknown>,
  key: IdsCountBoundKey,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<IdsCountBoundKey, number>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (!isFiniteNumber(value)) {
    diagnostics.push(invalidShape(`ids.${key} must be a number when provided.`));

    return {};
  }

  if (!isNonNegativeInteger(value)) {
    diagnostics.push(
      invalidShape(`ids.${key} must be a non-negative integer when provided.`),
    );

    return {};
  }

  return { [key]: value } as Partial<Record<IdsCountBoundKey, number>>;
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
  return isNonNegativeInteger(value);
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
