import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeAssertion } from "./index.js";
import {
  diagnostic,
  invalidShape,
  stringArray,
  unsupportedKeys,
} from "./schema-values.js";

const SUPPORTED_ASSERTION_KEYS = [
  "sectionsRequired",
  "tableColumnsRequired",
  "text",
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
    ...tableColumnsRequiredFromValue(value.tableColumnsRequired, diagnostics),
    ...textAssertionFromValue(value.text, diagnostics),
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

  unsupportedKeys(value, ["contains"], diagnostics);

  if (typeof value.contains !== "string" || value.contains.length === 0) {
    diagnostics.push(invalidShape("text.contains must be a non-empty string."));

    return {};
  }

  return { text: { contains: value.contains } };
}
