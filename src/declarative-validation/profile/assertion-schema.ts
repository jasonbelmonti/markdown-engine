import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeAssertion, DeclarativeIdSource } from "./index.js";
import {
  diagnostic,
  invalidShape,
  nonEmptyString,
  stringArray,
  unsupportedKeys,
} from "./schema-values.js";

const SUPPORTED_ASSERTION_KEYS = [
  "sectionsRequired",
  "sectionOrder",
  "tableColumnsRequired",
  "ids",
  "references",
  "text",
  "textOccurrenceCount",
  "frontmatterRequired",
] as const;
const REGEX_LIKE_KEYS = new Set(["matches", "pattern", "regex", "regexp"]);

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
    ...sectionOrderFromValue(value.sectionOrder, diagnostics),
    ...tableColumnsRequiredFromValue(value.tableColumnsRequired, diagnostics),
    ...idsFromValue(value.ids, diagnostics),
    ...referencesFromValue(value.references, diagnostics),
    ...textAssertionFromValue(value.text, diagnostics),
    ...textOccurrenceCountFromValue(value.textOccurrenceCount, diagnostics),
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

    if (REGEX_LIKE_KEYS.has(key)) {
      unsupportedKeys({ [key]: value[key] }, [], diagnostics);
      continue;
    }

    diagnostics.push(
      diagnostic(
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

function sectionOrderFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): Pick<DeclarativeAssertion, "sectionOrder"> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("sectionOrder must be an object."));

    return {};
  }

  unsupportedKeys(value, ["headings"], diagnostics);

  const headings = stringArray(value.headings);
  if (headings === undefined) {
    diagnostics.push(
      invalidShape("sectionOrder.headings must be an array of non-empty strings."),
    );

    return {};
  }

  return { sectionOrder: { headings } };
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

  unsupportedKeys(value, ["column", "prefix", "unique", "caseSensitive"], diagnostics);

  if (value.unique !== true) {
    diagnostics.push(invalidShape("ids.unique must be true."));

    return {};
  }

  return {
    ids: {
      ...optionalAssertionString(value, "column", diagnostics),
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

  unsupportedKeys(
    value,
    ["column", "contains", "containsExactlyOne", "excludes"],
    diagnostics,
  );

  const text = {
    ...optionalAssertionString(value, "column", diagnostics),
    ...optionalAssertionString(value, "contains", diagnostics),
    ...optionalAssertionString(value, "containsExactlyOne", diagnostics),
    ...optionalStringArray(value, "excludes", diagnostics),
  };

  if (!hasTextPredicate(text)) {
    diagnostics.push(
      invalidShape(
        "text must include contains, containsExactlyOne, or a non-empty excludes array.",
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

  unsupportedKeys(value, ["text", "count", "column"], diagnostics);

  const text = nonEmptyString(value.text);
  const count = finiteNumber(value.count);

  if (text === undefined) {
    diagnostics.push(
      invalidShape("textOccurrenceCount.text must be a non-empty string."),
    );
  }

  if (count === undefined) {
    diagnostics.push(invalidShape("textOccurrenceCount.count must be a number."));
  }

  return text === undefined || count === undefined
    ? {}
    : {
        textOccurrenceCount: {
          text,
          count,
          ...optionalAssertionString(value, "column", diagnostics),
        },
      };
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
): Record<string, string> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (typeof value !== "string" || value.length === 0) {
    diagnostics.push(invalidShape(`${key} must be a non-empty string when provided.`));

    return {};
  }

  return { [key]: value };
}

function optionalStringArray(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Record<string, readonly string[]> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  const values = stringArray(value);

  if (values === undefined) {
    diagnostics.push(
      invalidShape(`${key} must be an array of non-empty strings when provided.`),
    );

    return {};
  }

  return { [key]: values };
}

function optionalBoolean(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Record<string, boolean> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (typeof value !== "boolean") {
    diagnostics.push(invalidShape(`${key} must be a boolean when provided.`));

    return {};
  }

  return { [key]: value };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function hasTextPredicate(text: DeclarativeAssertion["text"]): boolean {
  return (
    text?.contains !== undefined ||
    text?.containsExactlyOne !== undefined ||
    text?.excludes !== undefined
  );
}
