import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeSelector,
  DeclarativeTableCellPredicate,
} from "./index.js";
import {
  diagnostic,
  invalidShape,
  nonEmptyString,
  optionalString,
  optionalStringArray,
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
    diagnostics.push(invalidShape("Rule select.target must be provided."));

    return undefined;
  }

  if (typeof value.target !== "string") {
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
        ...optionalString(value, "title", diagnostics),
        ...optionalNumber(value, "depth", diagnostics),
      };

    case "heading":
      unsupportedKeys(value, ["target", "text", "depth"], diagnostics);
      return {
        target: "heading",
        ...optionalString(value, "text", diagnostics),
        ...optionalNumber(value, "depth", diagnostics),
      };

    case "table":
      unsupportedKeys(value, ["target", "section", "header"], diagnostics);
      return {
        target: "table",
        ...optionalString(value, "section", diagnostics),
        ...optionalStringArray(value, "header", diagnostics),
      };

    case "tableRow":
      unsupportedKeys(value, ["target", "section", "tableHeader", "where"], diagnostics);
      return {
        target: "tableRow",
        ...optionalString(value, "section", diagnostics),
        ...optionalStringArray(value, "tableHeader", diagnostics),
        ...optionalCellPredicate(value, "where", diagnostics),
      };

    case "tableCell": {
      unsupportedKeys(
        value,
        ["target", "section", "tableHeader", "column", "rowWhere"],
        diagnostics,
      );

      const column = nonEmptyString(value.column);
      if (column === undefined) {
        diagnostics.push(
          invalidShape("Selector column must be a non-empty string."),
        );

        return undefined;
      }

      return {
        target: "tableCell",
        column,
        ...optionalString(value, "section", diagnostics),
        ...optionalStringArray(value, "tableHeader", diagnostics),
        ...optionalCellPredicate(value, "rowWhere", diagnostics),
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
        ...optionalString(value, "section", diagnostics),
        ...optionalString(value, "nodeType", diagnostics),
        ...optionalString(value, "textIncludes", diagnostics),
      };

    case "link":
      unsupportedKeys(value, ["target", "section", "text", "url"], diagnostics);
      return {
        target: "link",
        ...optionalString(value, "section", diagnostics),
        ...optionalString(value, "text", diagnostics),
        ...optionalString(value, "url", diagnostics),
      };

    case "list":
      unsupportedKeys(value, ["target", "section", "ordered", "depth"], diagnostics);
      return {
        target: "list",
        ...optionalString(value, "section", diagnostics),
        ...optionalBoolean(value, "ordered", diagnostics),
        ...optionalNumber(value, "depth", diagnostics),
      };

    case "frontmatter":
      unsupportedKeys(value, ["target", "field"], diagnostics);
      return {
        target: "frontmatter",
        ...optionalString(value, "field", diagnostics),
      };

    default:
      diagnostics.push(
        diagnostic(
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

  const column = nonEmptyString(value.column);
  if (column === undefined) {
    diagnostics.push(
      invalidShape(`Selector ${key}.column must be a non-empty string.`),
    );

    return undefined;
  }

  return {
    column,
    ...optionalString(value, "equals", diagnostics),
    ...optionalString(value, "includes", diagnostics),
  };
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
    diagnostics.push(
      invalidShape(`Selector ${key} must be a boolean when provided.`),
    );

    return {};
  }

  return { [key]: value };
}

function optionalNumber(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Record<string, number> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    diagnostics.push(
      invalidShape(`Selector ${key} must be a number when provided.`),
    );

    return {};
  }

  return { [key]: value };
}
