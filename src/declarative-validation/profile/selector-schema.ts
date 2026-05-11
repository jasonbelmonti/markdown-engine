import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { profileDiagnostic } from "../diagnostics/profile-config-diagnostics.js";
import type {
  DeclarativeSelector,
  DeclarativeTableCellPredicate,
} from "./index.js";
import {
  invalidShape,
  optionalBooleanField,
  optionalNumberField,
  optionalStringArrayField,
  optionalStringField,
  requiredNonEmptyStringField,
  unsupportedKeys,
} from "./schema-values.js";

export function selectorFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeSelector | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("Rule select must be an object."));

    return undefined;
  }

  if (value.target === undefined) {
    unsupportedKeys(value, ["target"], diagnostics);
    diagnostics.push(invalidShape("Rule select.target must be provided."));

    return undefined;
  }

  if (typeof value.target !== "string") {
    unsupportedKeys(value, ["target"], diagnostics);
    diagnostics.push(invalidShape("Rule select.target must be a string."));

    return undefined;
  }

  switch (value.target) {
    case "document":
      unsupportedKeys(value, ["target"], diagnostics);
      return { target: "document" };

    case "section":
      unsupportedKeys(value, ["target", "title", "depth"], diagnostics);
      return {
        target: "section",
        ...optionalSelectorString(value, "title", diagnostics),
        ...optionalNumber(value, "depth", diagnostics),
      };

    case "heading":
      unsupportedKeys(value, ["target", "text", "depth"], diagnostics);
      return {
        target: "heading",
        ...optionalSelectorString(value, "text", diagnostics),
        ...optionalNumber(value, "depth", diagnostics),
      };

    case "table":
      unsupportedKeys(value, ["target", "section", "header"], diagnostics);
      return {
        target: "table",
        ...optionalSelectorString(value, "section", diagnostics),
        ...optionalSelectorStringArray(value, "header", diagnostics),
      };

    case "tableRow":
      unsupportedKeys(value, ["target", "section", "tableHeader", "where"], diagnostics);
      return {
        target: "tableRow",
        ...optionalSelectorString(value, "section", diagnostics),
        ...optionalSelectorStringArray(value, "tableHeader", diagnostics),
        ...optionalCellPredicate(value, "where", diagnostics),
      };

    case "tableCell": {
      unsupportedKeys(
        value,
        ["target", "section", "tableHeader", "column", "rowWhere"],
        diagnostics,
      );

      const selector = {
        ...optionalSelectorString(value, "section", diagnostics),
        ...optionalSelectorStringArray(value, "tableHeader", diagnostics),
        ...optionalCellPredicate(value, "rowWhere", diagnostics),
      };
      const column = requiredSelectorString(
        value.column,
        "column",
        diagnostics,
      );

      if (column === undefined) {
        return undefined;
      }

      return {
        target: "tableCell",
        column,
        ...selector,
      };
    }

    case "textSpan":
      unsupportedKeys(
        value,
        ["target", "section", "nodeType", "textIncludes"],
        diagnostics,
      );
      return {
        target: "textSpan",
        ...optionalSelectorString(value, "section", diagnostics),
        ...optionalSelectorString(value, "nodeType", diagnostics),
        ...optionalSelectorString(value, "textIncludes", diagnostics),
      };

    case "link":
      unsupportedKeys(value, ["target", "section", "text", "url"], diagnostics);
      return {
        target: "link",
        ...optionalSelectorString(value, "section", diagnostics),
        ...optionalSelectorString(value, "text", diagnostics),
        ...optionalSelectorString(value, "url", diagnostics),
      };

    case "list":
      unsupportedKeys(value, ["target", "section", "ordered", "depth"], diagnostics);
      return {
        target: "list",
        ...optionalSelectorString(value, "section", diagnostics),
        ...optionalBoolean(value, "ordered", diagnostics),
        ...optionalNumber(value, "depth", diagnostics),
      };

    default:
      unsupportedKeys(value, ["target"], diagnostics);
      diagnostics.push(
        profileDiagnostic(
          "profile.compile.unsupportedSelector",
          `Unsupported selector target "${String(value.target)}".`,
        ),
      );

      return undefined;
  }
}

function optionalCellPredicate(
  record: Record<string, unknown>,
  key: "where" | "rowWhere",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"where" | "rowWhere", DeclarativeTableCellPredicate>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  const predicate = cellPredicateFromValue(value, key, diagnostics);

  return predicate === undefined ? {} : { [key]: predicate };
}

function cellPredicateFromValue(
  value: unknown,
  key: "where" | "rowWhere",
  diagnostics: MarkdownDiagnostic[],
): DeclarativeTableCellPredicate | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape(`Selector ${key} must be an object.`));

    return undefined;
  }

  unsupportedKeys(value, ["column", "equals", "includes"], diagnostics);

  const column = requiredSelectorString(value.column, `${key}.column`, diagnostics);
  if (column === undefined) {
    return undefined;
  }

  const predicate = {
    ...optionalSelectorString(value, "equals", diagnostics),
    ...optionalSelectorString(value, "includes", diagnostics),
  };

  if (predicate.equals === undefined && predicate.includes === undefined) {
    diagnostics.push(
      invalidShape(
        `Selector ${key} must include at least one of equals or includes.`,
      ),
    );

    return undefined;
  }

  return {
    column,
    ...predicate,
  };
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
    (field) => `Selector ${field} must be a boolean when provided.`,
  );
}

function optionalNumber(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<string, number>> {
  return optionalNumberField(
    record,
    key,
    diagnostics,
    (field) => `Selector ${field} must be a number when provided.`,
  );
}

function optionalSelectorString(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<string, string>> {
  return optionalStringField(
    record,
    key,
    diagnostics,
    (field) => `Selector ${field} must be a non-empty string when provided.`,
  );
}

function optionalSelectorStringArray(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<string, readonly string[]>> {
  return optionalStringArrayField(
    record,
    key,
    diagnostics,
    (field) =>
      `Selector ${field} must be an array of non-empty strings when provided.`,
  );
}

function requiredSelectorString(
  value: unknown,
  field: string,
  diagnostics: MarkdownDiagnostic[],
): string | undefined {
  return requiredNonEmptyStringField(
    value,
    field,
    diagnostics,
    (fieldName) => `Selector ${fieldName} must be a non-empty string.`,
  );
}
