import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeAssertion } from "./index.js";
import {
  invalidShape,
  stringArray,
  unsupportedKeys,
} from "./schema-values.js";

export function assertionFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeAssertion | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("Rule assert must be an object."));

    return undefined;
  }

  unsupportedKeys(
    value,
    ["sectionsRequired", "tableColumnsRequired", "text"],
    diagnostics,
  );

  const assertion = {
    ...sectionsRequiredFromValue(value.sectionsRequired, diagnostics),
    ...tableColumnsRequiredFromValue(value.tableColumnsRequired, diagnostics),
    ...textAssertionFromValue(value.text, diagnostics),
  };

  if (Object.keys(assertion).length === 0) {
    diagnostics.push(
      invalidShape("Rule assert must include at least one supported assertion."),
    );

    return undefined;
  }

  return assertion;
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
